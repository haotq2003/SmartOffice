const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { createAndSendNotification } = require('./notificationService');

/**
 * Check for overdue equipment bookings and send reminder notifications
 */
const checkOverdueBookings = async () => {
  try {
    const now = new Date();

    // Find bookings with status 'checked_in' where endTime is in the past
    // and overdueNotifiedAt was not set in the last 1 hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const overdueBookings = await Booking.find({
      status: 'checked_in',
      endTime: { $lt: now },
      $or: [
        { overdueNotifiedAt: null },
        { overdueNotifiedAt: { $lt: oneHourAgo } }
      ]
    }).populate('resourceId', 'name type location').populate('userId', 'name email');

    for (const booking of overdueBookings) {
      // Only process equipment resources
      if (booking.resourceId && booking.resourceId.type === 'equipment') {
        const resourceName = booking.resourceId.name || 'Thiết bị';
        const returnDateStr = new Date(booking.endTime).toLocaleDateString('vi-VN');

        // 1. Notify employee
        if (booking.userId) {
          await createAndSendNotification({
            tenantId: booking.tenantId,
            userId: booking.userId._id,
            title: `⚠️ Cảnh báo quá hạn trả thiết bị: ${resourceName}`,
            message: `Bạn chưa trả ${resourceName} (Hẹn trả ngày ${returnDateStr}). Vui lòng mang thiết bị hoàn trả về kho ngay.`,
            type: 'booking_rejected',
            referenceId: booking._id,
            emailData: {
              recipientEmail: booking.userId.email,
              recipientName: booking.userId.name,
              resourceName,
              location: booking.resourceId.location || 'Phòng thiết bị',
              startTime: booking.startTime,
              endTime: booking.endTime,
              status: 'overdue',
              notes: 'Cảnh báo quá hạn trả thiết bị'
            }
          });
        }

        // 2. Notify managers
        await createAndSendNotification({
          tenantId: booking.tenantId,
          title: `⚠️ Cảnh báo trễ hạn trả thiết bị: ${resourceName}`,
          message: `Nhân viên ${booking.userId?.name || 'Nhân viên'} chưa trả ${resourceName} (Hạn trả ngày: ${returnDateStr}).`,
          type: 'booking_rejected',
          referenceId: booking._id,
          targetRole: 'managers'
        });

        // Update overdueNotifiedAt timestamp
        booking.overdueNotifiedAt = now;
        await booking.save();
      }
    }
  } catch (error) {
    console.error('Error in checkOverdueBookings cron job:', error);
  }
};

/**
 * Start background cron checker running every 60 seconds
 */
const startOverdueChecker = (intervalMs = 60000) => {
  console.log('Overdue Equipment Cron Service started (Interval: 60s)');
  // Initial check on boot
  checkOverdueBookings();
  // Periodic check
  setInterval(checkOverdueBookings, intervalMs);
};

module.exports = {
  checkOverdueBookings,
  startOverdueChecker
};
