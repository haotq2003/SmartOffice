const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { createAndSendNotification } = require('./notificationService');
const {
  getExpiredBookingIds,
  removeProcessedBookings,
  syncActiveBookingsToRedis
} = require('./redisCheckinService');

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

const Tenant = require('../models/Tenant');

/**
 * Check for expired tenant subscriptions and automatically suspend tenant
 */
const checkSubscriptionExpirations = async () => {
  try {
    const now = new Date();
    const expiredTenants = await Tenant.find({
      status: 'active',
      planExpiredAt: { $ne: null, $lt: now }
    });

    for (const tenant of expiredTenants) {
      tenant.status = 'suspended';
      await tenant.save();
      console.log(`[Cron] Tenant "${tenant.name}" (${tenant._id}) has been automatically suspended due to expired plan.`);

      await createAndSendNotification({
        tenantId: tenant._id,
        title: `🔴 Cảnh báo hết hạn gói cước ${tenant.plan.toUpperCase()}`,
        message: `Gói dịch vụ SmartOffice của doanh nghiệp bạn đã hết hạn. Vui lòng gia hạn gói cước qua Ví MoMo ngay để mở khóa hệ thống.`,
        type: 'booking_rejected',
        targetRole: 'admin'
      }).catch(e => console.error('Error sending expiration notification:', e));
    }
  } catch (error) {
    console.error('Error in checkSubscriptionExpirations cron job:', error);
  }
};

/**
 * Check for room bookings that are 'approved' or 'confirmed' but user has NOT checked in
 * after grace period (15 minutes after startTime).
 * OPTIMIZED WITH REDIS ZSET:
 * - Checks in-memory Redis ZSET in < 0.5ms instead of querying MongoDB every minute.
 * - Only queries MongoDB when there are actual expired booking IDs.
 * - Auto-cancels no-show bookings, increments violation count, sends notifications & warning emails.
 */
const checkNoShowRoomBookings = async () => {
  try {
    // 1. Lấy danh sách ID các booking đã quá hạn 15 phút từ RAM của Redis
    const expiredBookingIds = await getExpiredBookingIds();

    if (!expiredBookingIds || expiredBookingIds.length === 0) {
      // 0 booking quá hạn -> Thoát ngay lập tức trong 0.1ms, KHÔNG làm nặng MongoDB!
      return;
    }

    console.log(`⏱️ [Redis Check-in Cron] Phát hiện ${expiredBookingIds.length} phòng họp quá hạn 15 phút chưa check-in!`);

    // 2. Chỉ truy vấn đúng các booking quá hạn từ MongoDB
    const pendingCheckinBookings = await Booking.find({
      _id: { $in: expiredBookingIds },
      status: { $in: ['approved', 'confirmed'] }
    })
      .populate('resourceId', 'name type location')
      .populate('userId', 'name email violationCount bookingBannedUntil');

    for (const booking of pendingCheckinBookings) {
      if (booking.resourceId && booking.resourceId.type === 'room') {
        const roomName = booking.resourceId.name || 'Phòng họp';
        const startTimeStr = new Date(booking.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(booking.startTime).toLocaleDateString('vi-VN');

        // 1. Đổi trạng thái sang no_show
        booking.status = 'no_show';
        await booking.save();
        console.log(`[Redis Cron] Booking "${booking._id}" cho phòng "${roomName}" đã tự động hủy (NO_SHOW) do quá 15 phút không quẹt thẻ.`);

        // 2. Xử phạt cộng vi phạm cho user
        if (booking.userId) {
          const user = await User.findById(booking.userId._id);
          if (user) {
            user.violationCount = (user.violationCount || 0) + 1;
            if (user.violationCount >= 2) {
              user.bookingBannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Tạm cấm đặt 7 ngày
            }
            await user.save();

            // 3. Gửi thông báo & email cảnh cáo tới nhân viên
            await createAndSendNotification({
              tenantId: booking.tenantId,
              userId: user._id,
              title: `⚠️ Hủy phòng tự động: Quá hạn Check-in ${roomName}`,
              message: `Lịch đặt ${roomName} lúc ${startTimeStr} (${dateStr}) của bạn đã bị hủy tự động do không quẹt thẻ RFID check-in sau 15 phút. Phòng đã được hoàn trả lại cho hệ thống. Bạn đã vi phạm ${user.violationCount} lần.${user.violationCount >= 2 ? ' Tài khoản bị tạm cấm đặt trong 7 ngày.' : ''}`,
              type: 'booking_rejected',
              referenceId: booking._id,
              emailData: {
                recipientEmail: user.email,
                recipientName: user.name,
                resourceName: roomName,
                location: booking.resourceId.location || 'Phòng họp',
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: 'no_show',
                notes: `Tự động hủy lịch do vắng mặt / Không quẹt thẻ check-in quá 15 phút. (Vi phạm lần ${user.violationCount})`
              }
            });
          }
        }

        // 4. Báo cho quản lý
        await createAndSendNotification({
          tenantId: booking.tenantId,
          title: `ℹ️ Thu hồi phòng tự động: ${roomName}`,
          message: `Nhân viên ${booking.userId?.name || 'Người dùng'} không đến nhận phòng họp ${roomName} (Quá 15 phút). Hệ thống đã tự động giải phóng phòng trống.`,
          type: 'booking_rejected',
          referenceId: booking._id,
          targetRole: 'managers'
        });
      }
    }

    // 3. Xóa các booking đã xử lý khỏi Redis ZSET
    await removeProcessedBookings(expiredBookingIds);
  } catch (error) {
    console.error('Error in checkNoShowRoomBookings Redis cron job:', error);
  }
};

/**
 * Start background cron checker running every 60 seconds
 */
const startOverdueChecker = (intervalMs = 60000) => {
  console.log('Overdue Equipment, Subscription & Room No-Show (Redis ZSET) Cron Service started (Interval: 60s)');
  // Đồng bộ phòng họp đang chờ check-in lên Redis khi server boot
  syncActiveBookingsToRedis();

  // Initial check on boot
  checkOverdueBookings();
  checkSubscriptionExpirations();
  checkNoShowRoomBookings();

  // Periodic check
  setInterval(() => {
    checkOverdueBookings();
    checkSubscriptionExpirations();
    checkNoShowRoomBookings();
  }, intervalMs);
};

module.exports = {
  checkOverdueBookings,
  checkSubscriptionExpirations,
  checkNoShowRoomBookings,
  startOverdueChecker
};
