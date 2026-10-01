const mongoose = require('mongoose');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Booking = require('../models/Booking');
const { createAndSendNotification } = require('../services/notificationService');
const { cancelCheckinDeadline } = require('../services/redisCheckinService');

/**
 * Handle door card swiping simulation.
 * Rule: Door ALWAYS opens ("ai cũng có thể vào").
 * If card owner has an active booking for this room -> Auto Check-in.
 */
const swipeCard = async (req, res) => {
  try {
    const { cardCode, resourceId, bookingId } = req.body;

    if (!resourceId) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn phòng cần quẹt thẻ.' });
    }

    const room = await Resource.findById(resourceId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    }

    // Find user by RFID card code, User ID or Email
    const trimmedCard = cardCode ? String(cardCode).trim() : '';
    let user = null;
    if (trimmedCard) {
      const isObjectId = mongoose.Types.ObjectId.isValid(trimmedCard);
      user = await User.findOne({
        $or: [
          { rfidCardId: { $regex: new RegExp(`^${trimmedCard}$`, 'i') } },
          { email: trimmedCard.toLowerCase() },
          ...(isObjectId ? [{ _id: trimmedCard }] : []),
        ],
      }).select('name email role rfidCardId');
    }

    const now = new Date();

    // If user is recognized, check for matching booking in this room
    let matchedBooking = null;
    if (user) {
      // 1. If a specific bookingId is passed (e.g. from My Bookings demo button), check it directly
      if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
        matchedBooking = await Booking.findOne({
          _id: bookingId,
          userId: user._id,
          status: { $in: ['approved', 'confirmed'] },
        }).populate('resourceId', 'name location');
      }

      // 2. Otherwise find booking around current time (15 mins before start until end)
      if (!matchedBooking) {
        const fifteenMinsBeforeStart = new Date(now.getTime() + 15 * 60 * 1000);

        matchedBooking = await Booking.findOne({
          userId: user._id,
          resourceId: room._id,
          status: { $in: ['approved', 'confirmed'] },
          startTime: { $lte: fifteenMinsBeforeStart },
          endTime: { $gte: now },
        }).populate('resourceId', 'name location');
      }

      if (matchedBooking) {
        matchedBooking.status = 'checked_in';
        matchedBooking.checkedInAt = now;
        await matchedBooking.save();

        // 🟢 HỦY HẸN GIỜ PHẠT TRÊN REDIS: Đã quẹt thẻ check-in thành công
        cancelCheckinDeadline(matchedBooking._id).catch(e => console.error(e));

        createAndSendNotification({
          tenantId: matchedBooking.tenantId,
          userId: user._id,
          title: `🟢 Check-in phòng họp thành công: ${room.name}`,
          message: `Bạn đã quẹt thẻ RFID check-in thành công vào ${room.name} (${room.location || ''}). Chúc bạn có một buổi họp hiệu quả!`,
          type: 'booking_approved',
          referenceId: matchedBooking._id,
          emailData: {
            recipientEmail: user.email,
            recipientName: user.name,
            resourceName: room.name,
            location: room.location || 'Phòng họp',
            startTime: matchedBooking.startTime,
            endTime: matchedBooking.endTime,
            status: 'checked_in',
            notes: 'Check-in thành công qua cửa RFID Smart Lock.'
          }
        }).catch(err => console.error('Error sending checkin notification:', err));
      }
    }

    // Door ALWAYS opens ("ai cũng vào được")
    const responseData = {
      success: true,
      doorUnlocked: true,
      timestamp: now,
      roomName: room.name,
      roomLocation: room.location,
      user: user ? { id: user._id, name: user.name, email: user.email, rfidCardId: user.rfidCardId } : null,
      checkInSuccess: !!matchedBooking,
      booking: matchedBooking,
      message: user
        ? matchedBooking
          ? `🟢 CỬA ĐÃ MỞ! Nhận diện nhân viên ${user.name} (${user.rfidCardId}) - Tự động Check-in thành công cho đơn đặt phòng!`
          : `🟡 CỬA ĐÃ MỞ! Thẻ nhân viên ${user.name} (${user.rfidCardId}) - Vào phòng tự do (Không có lịch đặt phòng trùng khớp lúc này).`
        : `⚪ CỬA ĐÃ MỞ! Khách / Thẻ vãng lai vào phòng tự do.`,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in swipeCard:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get rooms & users list for Door Simulator UI selection
 */
const getSimulatorData = async (req, res) => {
  try {
    const rooms = await Resource.find({ type: 'room' }).select('name location status capacity images');

    // Auto-assign RFID Card ID for any legacy user that doesn't have one
    const usersWithoutCard = await User.find({
      $or: [{ rfidCardId: null }, { rfidCardId: '' }, { rfidCardId: { $exists: false } }]
    });
    for (const u of usersWithoutCard) {
      let isUnique = false;
      while (!isUnique) {
        const candidate = `RFID-${Math.floor(1000 + Math.random() * 9000)}`;
        const exists = await User.findOne({ rfidCardId: candidate });
        if (!exists) {
          u.rfidCardId = candidate;
          await u.save();
          isUnique = true;
        }
      }
    }

    const users = await User.find({}).select('name email role rfidCardId');
    const activeBookings = await Booking.find({
      status: { $in: ['approved', 'confirmed', 'checked_in'] },
    })
      .populate('userId', 'name email rfidCardId')
      .populate('resourceId', 'name location')
      .sort({ startTime: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      rooms,
      users,
      activeBookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  swipeCard,
  getSimulatorData,
};
