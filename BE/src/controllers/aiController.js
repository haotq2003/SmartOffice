const { processNaturalLanguageBooking } = require('../services/aiBookingService');
const Tenant = require('../models/Tenant');

/**
 * Endpoint xử lý yêu cầu đặt phòng thông minh bằng AI
 * POST /api/ai/smart-booking
 */
const handleSmartBookingChat = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp nội dung yêu cầu (prompt).'
      });
    }

    let tenantId = req.user?.tenantId;

    // Nếu là Super Admin hoặc chưa có tenantId, tự động lấy Tenant đầu tiên để trải nghiệm/test
    if (!tenantId) {
      const defaultTenant = await Tenant.findOne();
      tenantId = defaultTenant ? defaultTenant._id : null;
    }

    const result = await processNaturalLanguageBooking({
      userPrompt: prompt.trim(),
      tenantId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[AI Smart Booking Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi xử lý yêu cầu trợ lý AI'
    });
  }
};

module.exports = {
  handleSmartBookingChat
};
