const redis = require('../config/redis');
const Booking = require('../models/Booking');

const CHECKIN_ZSET_KEY = 'checkin:deadlines';
const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 phút gia hạn quẹt thẻ sau giờ bắt đầu họp

/**
 * Lên lịch hẹn giờ 15 phút cho phòng họp trên Redis ZSET
 * Score = startTime + 15 phút (timestamp mili-giây)
 */
const scheduleCheckinDeadline = async (booking) => {
  if (!redis || !booking) return;

  try {
    const startTime = new Date(booking.startTime).getTime();
    if (isNaN(startTime)) return;

    const deadlineTimestamp = startTime + GRACE_PERIOD_MS;
    const now = Date.now();

    // Nếu thời hạn chót vẫn còn trong tương lai
    if (deadlineTimestamp > now) {
      await redis.zadd(CHECKIN_ZSET_KEY, deadlineTimestamp, booking._id.toString());
      console.log(`⏱️ [Redis Check-in] Đã lên lịch hẹn giờ 15p cho Booking "${booking._id}". Hạn chót: ${new Date(deadlineTimestamp).toLocaleTimeString('vi-VN')}`);
    }
  } catch (error) {
    console.error('⚠️ [Redis Check-in] Lỗi khi lên lịch hẹn giờ:', error.message);
  }
};

/**
 * Hủy hẹn giờ phạt khi nhân viên đã quẹt thẻ RFID hoặc hủy phòng
 */
const cancelCheckinDeadline = async (bookingId) => {
  if (!redis || !bookingId) return;

  try {
    const removed = await redis.zrem(CHECKIN_ZSET_KEY, bookingId.toString());
    if (removed > 0) {
      console.log(`🟢 [Redis Check-in] Đã hủy theo dõi quá hạn cho Booking "${bookingId}" (Đã check-in thẻ hoặc hủy lịch).`);
    }
  } catch (error) {
    console.error('⚠️ [Redis Check-in] Lỗi khi hủy lịch hẹn giờ:', error.message);
  }
};

/**
 * Lấy danh sách ID các booking đã quá hạn 15 phút từ RAM của Redis (Score <= now)
 * Không cần quét MongoDB!
 */
const getExpiredBookingIds = async () => {
  if (!redis) return [];

  try {
    const now = Date.now();
    // Lấy các phần tử có score từ 0 đến now
    const expiredIds = await redis.zrangebyscore(CHECKIN_ZSET_KEY, 0, now);
    return expiredIds || [];
  } catch (error) {
    console.error('⚠️ [Redis Check-in] Lỗi khi kiểm tra danh sách quá hạn:', error.message);
    return [];
  }
};

/**
 * Xóa các booking đã xử lý phạt khỏi Redis ZSET
 */
const removeProcessedBookings = async (bookingIds) => {
  if (!redis || !bookingIds || bookingIds.length === 0) return;

  try {
    await redis.zrem(CHECKIN_ZSET_KEY, ...bookingIds);
  } catch (error) {
    console.error('⚠️ [Redis Check-in] Lỗi khi xóa booking đã xử lý:', error.message);
  }
};

/**
 * Đồng bộ các phòng họp đã duyệt đang chờ check-in từ MongoDB lên Redis khi khởi động server
 */
const syncActiveBookingsToRedis = async () => {
  if (!redis) return;

  try {
    const now = Date.now();
    const fifteenMinutesAgo = new Date(now - GRACE_PERIOD_MS);

    const activeRoomBookings = await Booking.find({
      status: { $in: ['approved', 'confirmed'] },
      startTime: { $gt: fifteenMinutesAgo }
    }).populate('resourceId', 'type');

    let count = 0;
    for (const b of activeRoomBookings) {
      if (b.resourceId && b.resourceId.type === 'room') {
        const deadline = new Date(b.startTime).getTime() + GRACE_PERIOD_MS;
        if (deadline > now) {
          await redis.zadd(CHECKIN_ZSET_KEY, deadline, b._id.toString());
          count++;
        }
      }
    }

    if (count > 0) {
      console.log(`🔄 [Redis Check-in] Đã đồng bộ ${count} phòng họp đang chờ check-in lên Redis ZSET.`);
    }
  } catch (error) {
    console.error('⚠️ [Redis Check-in] Lỗi khi đồng bộ booking lên Redis:', error.message);
  }
};

module.exports = {
  scheduleCheckinDeadline,
  cancelCheckinDeadline,
  getExpiredBookingIds,
  removeProcessedBookings,
  syncActiveBookingsToRedis,
};
