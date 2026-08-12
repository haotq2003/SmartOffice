const bookingService = require('../services/bookingService');
const Resource = require('../models/Resource');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { createAndSendNotification } = require('../services/notificationService');
const { sendEmail, generateMeetingInviteHtml } = require('../services/emailService');

const createBooking = async (req, res) => {
  try {
    const { resourceId, startTime, endTime, notes, attendees } = req.body;

    if (!resourceId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID, start time, and end time are required.'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start or end time format.'
      });
    }

    // End time must be after start time
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time.'
      });
    }

    // Cannot book in the past
    const now = new Date();
    // Allow a small buffer (e.g., 1 minute) for network delay
    if (start < new Date(now.getTime() - 60000)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create booking in the past.'
      });
    }

    // Verify resource exists and belongs to the same tenant
    const resource = await Resource.findOne({ _id: resourceId, tenantId: req.user.tenantId });
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found or access denied.'
      });
    }

    if (resource.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'Resource is currently under maintenance and cannot be booked.'
      });
    }

    // Working hours validation: 08:00 - 17:30 local time
    const startHour = start.getHours();
    const startMin = start.getMinutes();
    const endHour = end.getHours();
    const endMin = end.getMinutes();

    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;

    const workStart = 8 * 60; // 08:00
    const workEnd = 17 * 60 + 30; // 17:30

    if (startTotalMinutes < workStart || endTotalMinutes > workEnd) {
      return res.status(400).json({
        success: false,
        message: 'Booking time must be within working hours (08:00 - 17:30).'
      });
    }

    // Process attendees list
    let attendeesList = [];
    if (Array.isArray(attendees)) {
      attendeesList = attendees.map(e => String(e).trim()).filter(Boolean);
    } else if (typeof attendees === 'string') {
      attendeesList = attendees.split(',').map(e => e.trim()).filter(Boolean);
    }

    // Determine initial status based on resource isAutoApprove flag
    const initialStatus = resource.isAutoApprove ? 'approved' : 'pending';

    // Call service to check overlap and create booking
    const booking = await bookingService.createBooking({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      resourceId,
      startTime: start,
      endTime: end,
      notes,
      attendees: attendeesList,
      status: initialStatus
    });

    // Send notifications (async, non-blocking)
    const currentUser = await User.findById(req.user.userId);
    const creatorName = currentUser ? currentUser.name : 'Nhân viên';

    // 1. Notify tenant managers
    createAndSendNotification({
      tenantId: req.user.tenantId,
      title: `Yêu cầu đặt lịch mới: ${resource.name}`,
      message: `${creatorName} đã tạo yêu cầu đặt ${resource.name} từ ${start.toLocaleString('vi-VN')} đến ${end.toLocaleString('vi-VN')}.`,
      type: 'booking_created',
      referenceId: booking._id,
      targetRole: 'managers',
      emailData: {
        resourceName: resource.name,
        startTime: start,
        endTime: end,
        status: initialStatus,
        notes
      }
    });

    // 2. Notify the creator (Confirmation)
    createAndSendNotification({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      title: `Đặt lịch ${resource.name} thành công`,
      message: `Bạn đã tạo yêu cầu đặt ${resource.name}. Trạng thái: ${initialStatus === 'approved' ? 'Đã duyệt' : 'Chờ phê duyệt'}.`,
      type: 'booking_created',
      referenceId: booking._id,
      emailData: {
        recipientEmail: currentUser?.email,
        recipientName: creatorName,
        resourceName: resource.name,
        startTime: start,
        endTime: end,
        status: initialStatus,
        notes
      }
    });

    // 3. Send Meeting Invites to all invited attendees via Email & In-App Notification
    if (attendeesList.length > 0) {
      attendeesList.forEach(async (email) => {
        // Send Email Invitation
        sendEmail({
          to: email,
          subject: `[SmartOffice] Thư mời họp: ${resource.name}`,
          html: generateMeetingInviteHtml({
            organizerName: creatorName,
            resourceName: resource.name,
            startTime: start,
            endTime: end,
            notes
          }),
          text: `Thư mời họp từ ${creatorName} tại ${resource.name} lúc ${start.toLocaleString('vi-VN')}`
        });

        // Check if attendee is a registered user in same tenant
        const attendeeUser = await User.findOne({ email, tenantId: req.user.tenantId });
        if (attendeeUser) {
          createAndSendNotification({
            tenantId: req.user.tenantId,
            userId: attendeeUser._id,
            title: `Thư mời tham dự họp: ${resource.name}`,
            message: `${creatorName} đã thêm bạn vào danh sách tham dự họp tại ${resource.name} (${start.toLocaleString('vi-VN')}).`,
            type: 'booking_created',
            referenceId: booking._id
          });
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking request created successfully.',
      data: booking
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getAvailability = async (req, res) => {
  try {
    const { resourceId, date } = req.query;

    if (!resourceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID and date (YYYY-MM-DD) are required.'
      });
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }

    // Verify resource belongs to the tenant
    const resource = await Resource.findOne({ _id: resourceId, tenantId: req.user.tenantId });
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found or access denied.'
      });
    }

    const bookings = await bookingService.getAvailability(resourceId, date);

    // Format list of occupied slots
    const occupiedSlots = bookings.map(b => ({
      bookingId: b._id,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      user: b.userId ? { name: b.userId.name, email: b.userId.email } : null
    }));

    res.status(200).json({
      success: true,
      data: occupiedSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user.userId, req.user.tenantId);
    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ tenantId: req.user.tenantId })
      .populate('userId', 'name email role')
      .populate('resourceId', 'name type capacity location')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: id, tenantId: req.user.tenantId },
      { status },
      { new: true }
    ).populate('userId', 'name email').populate('resourceId', 'name type');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    // Trigger notification to the booking creator
    if (booking.userId) {
      const statusText = status === 'approved' ? 'đã được Phê duyệt' : status === 'rejected' ? 'đã bị Từ chối' : 'đã cập nhật về Chờ duyệt';
      const type = status === 'approved' ? 'booking_approved' : status === 'rejected' ? 'booking_rejected' : 'booking_created';

      createAndSendNotification({
        tenantId: req.user.tenantId,
        userId: booking.userId._id,
        title: `Đơn đặt ${booking.resourceId?.name || 'Tài nguyên'} ${statusText}`,
        message: `Đơn đặt lịch từ ${new Date(booking.startTime).toLocaleString('vi-VN')} đến ${new Date(booking.endTime).toLocaleString('vi-VN')} của bạn ${statusText}.`,
        type,
        referenceId: booking._id,
        emailData: {
          recipientEmail: booking.userId.email,
          recipientName: booking.userId.name,
          resourceName: booking.resourceId?.name || 'Tài nguyên',
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          notes: booking.notes
        }
      });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBooking,
  getAvailability,
  getMyBookings,
  getAllBookings,
  updateBookingStatus
};
