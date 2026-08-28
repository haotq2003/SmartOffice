const express = require('express');
const router = express.Router();
const { createBooking, getAvailability, getMyBookings, getAllBookings, updateBookingStatus } = require('../controllers/bookingController');
const { verifyToken, authorizeRoles, checkSubscriptionStatus } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     BookingInput:
 *       type: object
 *       required:
 *         - resourceId
 *         - startTime
 *         - endTime
 *       properties:
 *         resourceId:
 *           type: string
 *           description: MongoDB ObjectId of the resource
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: ISO string representing start time (must be 08:00 - 17:30)
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: ISO string representing end time (must be 08:00 - 17:30)
 *         notes:
 *           type: string
 *           description: Optional notes for the booking request
 *         attendees:
 *           type: array
 *           items:
 *             type: string
 *           description: List of attendee email addresses
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Request a booking for a resource
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *     responses:
 *       201:
 *         description: Booking request created successfully (status pending)
 *       400:
 *         description: Invalid parameters, past time, or outside working hours (08:00 - 17:30)
 *       404:
 *         description: Resource not found or not belonging to the same tenant
 *       409:
 *         description: Time conflict with another active booking
 *       500:
 *         description: Server error
 */
router.post('/bookings', verifyToken, checkSubscriptionStatus, createBooking);

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: Retrieve booking history of the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bookings
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/bookings/my-bookings', verifyToken, getMyBookings);

/**
 * @swagger
 * /api/bookings/all:
 *   get:
 *     summary: Retrieve all bookings for the tenant (Admin & Manager only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tenant bookings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/bookings/all', verifyToken, authorizeRoles('manager', 'admin', 'super_admin'), getAllBookings);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update status of a booking (approved or rejected)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, pending]
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.patch('/bookings/:id/status', verifyToken, checkSubscriptionStatus, updateBookingStatus);

/**
 * @swagger
 * /api/availability:
 *   get:
 *     summary: Check active booking slots for a resource on a specific date
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The resource ID to inspect
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in format YYYY-MM-DD
 *     responses:
 *       200:
 *         description: List of booked slots
 *       400:
 *         description: Missing query parameters or invalid date format
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Server error
 */
router.get('/availability', verifyToken, getAvailability);

module.exports = router;
