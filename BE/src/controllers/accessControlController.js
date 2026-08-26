const User = require('../models/User');
const Resource = require('../models/Resource');
const Booking = require('../models/Booking');

/**
 * Handle door card swiping simulation.
 * Rule: Door ALWAYS opens ("ai cũng có thể vào").
 * If card owner has an active booking for this room -> Auto Check-in.
 */
const swipeCard = async (req, res) => {
  try {
    const { cardCode, resourceId } = req.body;

    if (!resourceId) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn phòng cần quẹt thẻ.' });
    }

    const room = await Resource.findById(resourceId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Phòng không tồn tại.' });
    }

    // Find user by RFID card code or ID
    const user = cardCode ? await User.findOne({ rfidCardId: cardCode }).select('name email role rfidCardId') : null;

    const now = new Date();

    // If user is recognized, check for matching booking in this room
    let matchedBooking = null;
    if (user) {
      // Find booking for this user in this room around current time
      // Allows check-in starting 15 minutes before startTime until endTime
      const fifteenMinsBeforeStart = new Date(now.getTime() + 15 * 60 * 1000);

      matchedBooking = await Booking.findOne({
        userId: user._id,
        resourceId: room._id,
        status: { $in: ['approved', 'confirmed'] },
        startTime: { $lte: fifteenMinsBeforeStart },
        endTime: { $gte: now },
      }).populate('resourceId', 'name location');

      if (matchedBooking) {
        matchedBooking.status = 'checked_in';
        matchedBooking.checkedInAt = now;
        await matchedBooking.save();
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
