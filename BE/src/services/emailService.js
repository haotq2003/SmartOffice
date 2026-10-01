const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`✉️ [Email Service Simulation] To: ${to} | Subject: ${subject}`);
      console.log(`Content: ${text || 'HTML Content'}`);
      return { success: true, simulated: true };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"SmartOffice System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

const generateBookingEmailHtml = ({ recipientName, action, resourceName, startTime, endTime, status, notes, resourceType, location }) => {
  const isNoShow = status === 'no_show';
  const isCheckedIn = status === 'checked_in';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  let statusColor = '#F59E0B';
  let statusText = 'Chờ phê duyệt';
  let bannerTitle = 'THÔNG BÁO CẬP NHẬT ĐƠN';
  let bannerBg = '#FFFBEB';

  if (isApproved) {
    statusColor = '#10B981';
    statusText = 'Đã duyệt thành công';
    bannerTitle = 'ĐƠN ĐÃ ĐƯỢC DUYỆT THÀNH CÔNG!';
    bannerBg = '#ECFDF5';
  } else if (isRejected) {
    statusColor = '#EF4444';
    statusText = 'Từ chối';
    bannerTitle = 'ĐƠN ĐÃ BỊ TỪ CHỐI';
    bannerBg = '#FEF2F2';
  } else if (isNoShow) {
    statusColor = '#DC2626';
    statusText = 'Hủy tự động do quá hạn Check-in (No-Show)';
    bannerTitle = '⚠️ LỊCH ĐẶT PHÒNG ĐÃ BỊ HỦY DO QUÁ HẠN CHECK-IN';
    bannerBg = '#FEF2F2';
  } else if (isCheckedIn) {
    statusColor = '#2563EB';
    statusText = 'Check-in thành công / Đang sử dụng';
    bannerTitle = '🟢 CHECK-IN THÀNH CÔNG';
    bannerBg = '#EFF6FF';
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: ${bannerBg}; border: 1px solid ${statusColor}; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h2 style="color: ${statusColor}; margin: 0; font-size: 18px;">${bannerTitle}</h2>
      </div>

      <p style="font-size: 15px; color: #1E293B;">Xin chào <strong>${recipientName}</strong>,</p>
      <p style="font-size: 14px; color: #475569;">Đơn yêu cầu đặt/mượn tài nguyên của bạn đã được cập nhật trạng thái mới nhất từ hệ thống SmartOffice:</p>
      
      <div style="background-color: #F8FAFC; padding: 16px; border-radius: 8px; border: 1px solid #F1F5F9; margin: 20px 0;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Tài nguyên:</strong> ${resourceName}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Địa điểm:</strong> ${location || 'Phòng họp / Thiết bị'}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Thời gian bắt đầu:</strong> ${new Date(startTime).toLocaleString('vi-VN')}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Thời gian kết thúc:</strong> ${new Date(endTime).toLocaleString('vi-VN')}</p>
        ${notes ? `<p style="margin: 6px 0; font-size: 14px;"><strong>Ghi chú:</strong> ${notes}</p>` : ''}
        <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Trạng thái:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
      </div>

      ${isApproved ? `<p style="font-size: 14px; color: #047857; background-color: #F0FDF4; padding: 12px; border-radius: 6px; font-weight: bold; border-left: 4px solid #10B981;">📌 <strong>Lưu ý:</strong> Vui lòng có mặt tại <strong>${location || 'phòng'}</strong> và quẹt thẻ RFID trong vòng 15 phút đầu giờ họp để hoàn tất Check-in. Quá 15 phút không check-in, phòng sẽ bị tự động thu hồi.</p>` : ''}

      ${isNoShow ? `<p style="font-size: 14px; color: #991B1B; background-color: #FEF2F2; padding: 12px; border-radius: 6px; font-weight: bold; border-left: 4px solid #DC2626;">⚠️ <strong>Cảnh báo:</strong> Bạn đã không thực hiện quẹt thẻ RFID check-in tại phòng họp trong vòng 15 phút đầu giờ. Phòng họp đã được hệ thống tự động thu hồi và mở lại cho các nhân sự khác sử dụng.</p>` : ''}

      <p style="color: #64748B; font-size: 13px; margin-top: 24px;">Bạn có thể truy cập hệ thống SmartOffice bất cứ lúc nào để kiểm tra chi tiết đơn.</p>
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
      <p style="color: #94A3B8; font-size: 12px; text-align: center;">Đây là email tự động từ hệ thống SmartOffice. Vui lòng không trả lời email này.</p>
    </div>
  `;
};

const generateMeetingInviteHtml = ({ organizerName, resourceName, startTime, endTime, notes }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="background-color: #2563EB; color: #ffffff; padding: 16px; border-radius: 6px; text-align: center;">
        <h2 style="margin: 0;">📩 Thư Mời Tham Dự Cuộc Họp</h2>
      </div>
      
      <p style="margin-top: 20px;">Xin chào,</p>
      <p><strong>${organizerName}</strong> vừa thêm bạn làm người tham dự cho cuộc họp tại <strong>${resourceName}</strong>.</p>

      <div style="background-color: #F8FAFC; padding: 16px; border-radius: 6px; border-left: 4px solid #2563EB; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>📍 Địa điểm / Phòng:</strong> ${resourceName}</p>
        <p style="margin: 4px 0;"><strong>🕒 Thời gian bắt đầu:</strong> ${new Date(startTime).toLocaleString('vi-VN')}</p>
        <p style="margin: 4px 0;"><strong>⌛ Thời gian kết thúc:</strong> ${new Date(endTime).toLocaleString('vi-VN')}</p>
        <p style="margin: 4px 0;"><strong>👤 Người chủ trì:</strong> ${organizerName}</p>
        ${notes ? `<p style="margin: 4px 0;"><strong>📝 Nội dung / Ghi chú:</strong> ${notes}</p>` : ''}
      </div>

      <p style="color: #64748B; font-size: 14px;">Vui lòng thu xếp thời gian tham dự đúng giờ.</p>
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
      <p style="color: #94A3B8; font-size: 12px; text-align: center;">SmartOffice System Notification</p>
    </div>
  `;
};

module.exports = {
  sendEmail,
  generateBookingEmailHtml,
  generateMeetingInviteHtml,
};
