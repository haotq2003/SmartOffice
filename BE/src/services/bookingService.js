const mongoose = require('mongoose');
const Booking = require('../models/Booking');

/**
 * Check if a resource has conflicting bookings for a given time range.
 * @param {string} resourceId - Resource ID
 * @param {Date|string} startTime - Start time of the booking
 * @param {Date|string} endTime - End time of the booking
 * @param {string} [excludeBookingId] - Optional booking ID to exclude (useful for updates)
 * @returns {Promise<boolean>} True if there is an overlap, false otherwise
 */
const checkOverlap = async (resourceId, startTime, endTime, excludeBookingId = null) => {
  const resourceObjId = mongoose.Types.ObjectId.isValid(resourceId)
    ? new mongoose.Types.ObjectId(resourceId)
    : resourceId;

  const query = {
    resourceId: resourceObjId,
    status: { $in: ['pending', 'confirmed', 'approved'] },
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await Booking.findOne(query);
  return !!conflict;
};

/**
 * Create a new booking after checking for conflicts.
 * @param {Object} bookingData - Booking details
 * @returns {Promise<Object>} The created booking
 * @throws {Error} If a conflict is found
 */
const createBooking = async (bookingData) => {
  const { resourceId, startTime, endTime } = bookingData;

  const hasOverlap = await checkOverlap(resourceId, startTime, endTime);
  if (hasOverlap) {
    const error = new Error('Resource is already booked during this time period.');
    error.statusCode = 409;
    throw error;
  }

  const booking = new Booking({
    ...bookingData,
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
    status: { $in: ['pending', 'confirmed', 'approved'] },
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
  createBooking,
  getAvailability,
  getUserBookings
};
