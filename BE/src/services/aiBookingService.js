const Resource = require('../models/Resource');
const Booking = require('../models/Booking');

/**
 * Danh sách model ưu tiên tự động chuyển đổi khi gặp tình trạng quá tải (High demand / 503 / 429)
 */
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite'
];

/**
 * Gọi Gemini API với cơ chế tự động Fallback qua các model khác khi bị quá tải
 */
async function callGeminiApiWithFallback(requestBody, apiKey) {
  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        return { data, modelUsed: model };
      }

      const errMsg = data.error?.message || `HTTP ${response.status}`;
      console.warn(`[SmartOffice AI] Model ${model} phản hồi lỗi: "${errMsg}". Đang chuyển model fallback...`);
      lastError = new Error(errMsg);

      // Nếu lỗi là 503 / High demand hoặc rate limit, tiếp tục thử model tiếp theo
      continue;
    } catch (err) {
      console.warn(`[SmartOffice AI] Lỗi kết nối khi gọi model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Tất cả các model Gemini đều đang quá tải.');
}

/**
 * Hàm nội bộ: Tìm kiếm các phòng/tài nguyên còn trống trong cơ sở dữ liệu MongoDB
 */
async function searchAvailableResourcesInDb({ tenantId, date, startTime, endTime, minCapacity, type = 'room', keyword }) {
  try {
    const startDateTime = new Date(`${date}T${startTime}:00.000Z`);
    const endDateTime = new Date(`${date}T${endTime}:00.000Z`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime()) || startDateTime >= endDateTime) {
      return { success: false, error: 'Khoảng thời gian không hợp lệ' };
    }

    const resourceQuery = {
      tenantId,
      status: 'available',
      type: type || 'room',
    };

    if (minCapacity && !isNaN(minCapacity)) {
      resourceQuery.capacity = { $gte: parseInt(minCapacity) };
    }

    if (keyword && typeof keyword === 'string') {
      resourceQuery.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { location: { $regex: keyword, $options: 'i' } },
      ];
    }

    const matchedResources = await Resource.find(resourceQuery).lean();

    if (!matchedResources || matchedResources.length === 0) {
      return { 
        success: true, 
        availableResources: [], 
        message: 'Không tìm thấy phòng họp hoặc tài nguyên nào phù hợp với yêu cầu này.' 
      };
    }

    const resourceIds = matchedResources.map(r => r._id);
    const conflictingBookings = await Booking.find({
      resourceId: { $in: resourceIds },
      status: { $in: ['pending', 'approved', 'confirmed', 'checked_in'] },
      $or: [
        {
          startTime: { $lt: endDateTime },
          endTime: { $gt: startDateTime },
        }
      ]
    }).lean();

    const busyResourceIds = new Set(conflictingBookings.map(b => b.resourceId.toString()));
    const availableResources = matchedResources.filter(r => !busyResourceIds.has(r._id.toString()));

    return {
      success: true,
      timeSlot: {
        date,
        startTime,
        endTime,
      },
      availableResources: availableResources.map(r => ({
        id: r._id,
        name: r.name,
        type: r.type,
        capacity: r.capacity,
        location: r.location,
        description: r.description,
        isAutoApprove: r.isAutoApprove,
      }))
    };
  } catch (error) {
    console.error('[AI Booking Search Error]:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Xử lý yêu cầu đặt phòng bằng ngôn ngữ tự nhiên thông qua Gemini Function Calling
 */
async function processNaturalLanguageBooking({ userPrompt, tenantId, user }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong .env');
  }

  const currentDateStr = new Date().toISOString().split('T')[0];
  const currentTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

  const tools = [
    {
      functionDeclarations: [
        {
          name: 'findAvailableResources',
          description: 'Tìm kiếm phòng họp hoặc tài nguyên văn phòng phù hợp và còn trống theo thời gian và tiêu chí yêu cầu.',
          parameters: {
            type: 'OBJECT',
            properties: {
              date: {
                type: 'STRING',
                description: `Ngày cần đặt theo định dạng YYYY-MM-DD. Lưu ý: Ngày hôm nay là ${currentDateStr}. Nếu người dùng nói 'ngày mai', 'thứ 6', hãy tự động tính ra ngày YYYY-MM-DD tương ứng.`
              },
              startTime: {
                type: 'STRING',
                description: 'Giờ bắt đầu theo định dạng HH:mm (24h, ví dụ: 09:00, 14:00, 15:30).'
              },
              endTime: {
                type: 'STRING',
                description: 'Giờ kết thúc theo định dạng HH:mm (24h, ví dụ: 10:30, 16:00). Nếu người dùng nói thời lượng (vd: họp 1 tiếng rưỡi), hãy cộng thêm vào startTime để tính endTime.'
              },
              minCapacity: {
                type: 'INTEGER',
                description: 'Sức chứa tối thiểu (số lượng người tham gia họp).'
              },
              type: {
                type: 'STRING',
                enum: ['room', 'equipment', 'vehicle'],
                description: 'Loại tài nguyên: room (phòng họp), equipment (thiết bị), vehicle (xe). Mặc định là room.'
              },
              keyword: {
                type: 'STRING',
                description: 'Từ khóa yêu cầu tiện ích hoặc tên phòng (ví dụ: máy chiếu, tivi, bảng trắng, micro, VIP...).'
              }
            },
            required: ['date', 'startTime', 'endTime']
          }
        }
      ]
    }
  ];

  const systemInstruction = `
Bạn là SmartOffice AI Assistant - Trợ lý đặt phòng họp và tài nguyên văn phòng thông minh của hệ thống SmartOffice.
Thời gian hệ thống hiện tại: Hôm nay là ${currentDateStr}, hiện tại là ${currentTimeStr}.
Nhiệm vụ:
1. Khi người dùng muốn tìm hoặc đặt phòng họp/thiết bị bằng ngôn ngữ tự nhiên, hãy gọi function 'findAvailableResources' với các tham số tương ứng được trích xuất.
2. Khi nhận được kết quả danh sách phòng trống từ hàm, hãy trả lời ngắn gọn, lịch sự, chuyên nghiệp bằng tiếng Việt, tóm tắt các phòng phù hợp nhất và mời người dùng bấm nút xác nhận đặt ngay.
3. Nếu không có phòng nào trống, hãy thông báo lịch sự và gợi ý người dùng đổi khung giờ khác.
`;

  // Bước 1: Gửi Prompt của người dùng lên Gemini (với cơ chế Fallback)
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    tools: tools
  };

  const { data: data1, modelUsed } = await callGeminiApiWithFallback(requestBody, apiKey);

  const candidate = data1.candidates?.[0];
  const functionCallPart = candidate?.content?.parts?.find(p => p.functionCall);

  let finalReply = '';
  let searchResultData = null;

  // Bước 2: Nếu Gemini quyết định gọi hàm tìm kiếm
  if (functionCallPart && functionCallPart.functionCall) {
    const { name, args } = functionCallPart.functionCall;
    console.log(`[SmartOffice AI] (${modelUsed}) gọi function: ${name} với tham số:`, args);

    if (name === 'findAvailableResources') {
      searchResultData = await searchAvailableResourcesInDb({
        tenantId,
        date: args.date,
        startTime: args.startTime,
        endTime: args.endTime,
        minCapacity: args.minCapacity,
        type: args.type || 'room',
        keyword: args.keyword
      });

      // Bước 3: Gửi kết quả thực thi của hàm lại cho Gemini để sinh câu trả lời tự nhiên
      const secondRequestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          },
          candidate.content,
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: 'findAvailableResources',
                  response: {
                    result: searchResultData
                  }
                }
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      };

      const { data: data2 } = await callGeminiApiWithFallback(secondRequestBody, apiKey);
      finalReply = data2.candidates?.[0]?.content?.parts?.[0]?.text || 'Đã tìm thấy danh sách phòng phù hợp bên dưới.';
    }
  } else {
    finalReply = candidate?.content?.parts?.find(p => p.text)?.text || 'Tôi có thể hỗ trợ bạn tìm và đặt phòng họp theo yêu cầu. Bạn cần đặt phòng vào thời gian nào?';
  }

  return {
    success: true,
    message: finalReply,
    searchParams: searchResultData?.timeSlot || null,
    recommendedRooms: searchResultData?.availableResources || []
  };
}

module.exports = {
  processNaturalLanguageBooking,
  searchAvailableResourcesInDb
};
