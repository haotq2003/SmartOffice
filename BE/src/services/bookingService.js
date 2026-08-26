const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Resource = require('../models/Resource');

/**
 * Check if a resource has conflicting bookings for a given time range.
 * For equipment, checks if total overlapping reserved quantity exceeds warehouse total capacity.
 * @param {string} resourceId - Resource ID
 * @param {Date|string} startTime - Start time of the booking
 * @param {Date|string} endTime - End time of the booking
 * @param {number} [requestedQuantity=1] - Requested quantity to book
 * @param {string} [excludeBookingId] - Optional booking ID to exclude (useful for updates)
 * @returns {Promise<boolean>} Resolves false if available, or throws error if conflict
 */
const checkOverlap = async (resourceId, startTime, endTime, requestedQuantity = 1, excludeBookingId = null) => {
  const resourceObjId = mongoose.Types.ObjectId.isValid(resourceId)
    ? new mongoose.Types.ObjectId(resourceId)
    : resourceId;

  const resource = await Resource.findById(resourceObjId);
  if (!resource) return false;

  const query = {
    resourceId: resourceObjId,
    status: { $in: ['pending', 'confirmed', 'approved', 'checked_in'] },
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  if (resource.type === 'equipment') {
    const existingBookings = await Booking.find(query);
    const totalBookedQuantity = existingBookings.reduce((sum, b) => sum + (b.quantity || 1), 0);
    const maxCapacity = resource.quantity || 1;

    if (totalBookedQuantity + requestedQuantity > maxCapacity) {
      const remainingAvailable = Math.max(0, maxCapacity - totalBookedQuantity);
      const error = new Error(`Thiết bị này không đủ số lượng trong khung giờ chọn (Chỉ còn trống ${remainingAvailable} cái).`);
      error.statusCode = 409;
      throw error;
    }
    return false;
  } else {
    const conflict = await Booking.findOne(query);
    if (conflict) {
      const error = new Error('Tài nguyên này đã được đăng ký trong khoảng thời gian trên.');
      error.statusCode = 409;
      throw error;
    }
    return false;
  }
};

/**
 * Check if a user already has an active booking for room/vehicle during a given time range.
 * Prevents personal schedule double-booking (e.g. 2 rooms at the same time).
 * Equipment loans do not count as personal schedule conflicts.
 */
const checkUserOverlap = async (userId, startTime, endTime, excludeBookingId = null) => {
  if (!userId) return null;
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const query = {
    userId: userObjId,
    status: { $in: ['pending', 'confirmed', 'approved', 'checked_in'] },
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const userBookings = await Booking.find(query).populate('resourceId', 'name type');
  // Only room or vehicle bookings count as personal schedule conflicts
  const roomOrVehicleConflict = userBookings.find(b => b.resourceId && b.resourceId.type !== 'equipment');
  return roomOrVehicleConflict || null;
};

/**
 * Create a new booking after checking for resource and user schedule conflicts.
 * @param {Object} bookingData - Booking details
 * @returns {Promise<Object>} The created booking
 * @throws {Error} If a conflict is found
 */
const createBooking = async (bookingData) => {
  const { resourceId, userId, startTime, endTime, quantity } = bookingData;
  const reqQty = Number(quantity) || 1;

  const resourceObjId = mongoose.Types.ObjectId.isValid(resourceId)
    ? new mongoose.Types.ObjectId(resourceId)
    : resourceId;
  const resource = await Resource.findById(resourceObjId);

  // 1. Check resource availability conflict (quantity-aware for equipment)
  await checkOverlap(resourceId, startTime, endTime, reqQty);

  // 2. Check user personal schedule conflict (Only for rooms & vehicles)
  if (resource && resource.type !== 'equipment') {
    const userConflict = await checkUserOverlap(userId, startTime, endTime);
    if (userConflict) {
      const resourceName = userConflict.resourceId?.name || 'tài nguyên khác';
      const error = new Error(`Bạn đã có lịch đặt "${resourceName}" trùng khung giờ này. Không thể đặt thêm phòng/xe khác!`);
      error.statusCode = 409;
      throw error;
    }
  }

  const booking = new Booking({
    ...bookingData,
    quantity: reqQty,
    status: bookingData.status || 'pending'
  });

  return await booking.save();
};

/**
 * Get all active bookings for a resource on a specific date.
 * @param {string} resourceId - Resource ID
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Promise<Array>} List of bookings on the specified date
 */
const getAvailability = async (resourceId, dateStr) => {
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  return await Booking.find({
    resourceId,
    status: { $in: ['pending', 'confirmed', 'approved', 'checked_in'] },
    $or: [
      { startTime: { $gte: startOfDay, $lte: endOfDay } },
      { endTime: { $gte: startOfDay, $lte: endOfDay } },
      { startTime: { $lte: startOfDay }, endTime: { $gte: endOfDay } }
    ]
  }).select('startTime endTime status userId').populate('userId', 'name email');
};

/**
 * Get bookings created by a specific user.
 * @param {string} userId - User ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} List of user bookings
 */
const getUserBookings = async (userId, tenantId) => {
  return await Booking.find({ userId, tenantId })
    .populate('resourceId', 'name type capacity status')
    .sort({ startTime: -1 });
};

module.exports = {
  checkOverlap,
  checkUserOverlap,
  createBooking,
  getAvailability,
  getUserBookings
};
