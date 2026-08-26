const bookingService = require('../services/bookingService');
const Resource = require('../models/Resource');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { createAndSendNotification } = require('../services/notificationService');
const { sendEmail, generateMeetingInviteHtml } = require('../services/emailService');

const createBooking = async (req, res) => {
  try {
    const { resourceId, startTime, endTime, notes, attendees, quantity } = req.body;

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

    // Working hours validation: 08:00 - 17:30 local time (Only for rooms / vehicles)
    if (resource.type !== 'equipment') {
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
      userId: req.user.userId || req.user._id,
      resourceId,
      startTime: start,
      endTime: end,
      notes,
      attendees: attendeesList,
      quantity: Number(quantity) || 1,
      status: initialStatus
    });

    // Send notifications (async, non-blocking)
    const currentUser = await User.findById(req.user.userId);
    const creatorName = currentUser ? currentUser.name : 'Nhân viên';

    // 1. Notify tenant managers via In-App notification ONLY (No Email)
    createAndSendNotification({
      tenantId: req.user.tenantId,
      title: `Yêu cầu đặt lịch mới: ${resource.name}`,
      message: `${creatorName} đã tạo yêu cầu đặt ${resource.name} từ ${start.toLocaleString('vi-VN')} đến ${end.toLocaleString('vi-VN')}.`,
      type: 'booking_created',
      referenceId: booking._id,
      targetRole: 'managers',
    });

    // 2. Notify the creator (In-App notification always, Email ONLY if auto-approved)
    createAndSendNotification({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      title: `Đặt lịch ${resource.name} ${initialStatus === 'approved' ? 'thành công' : 'đang chờ duyệt'}`,
      message: `Bạn đã tạo yêu cầu đặt ${resource.name}. Trạng thái: ${initialStatus === 'approved' ? 'Đã duyệt' : 'Chờ phê duyệt'}.`,
      type: 'booking_created',
      referenceId: booking._id,
      emailData: initialStatus === 'approved' ? {
        recipientEmail: currentUser?.email,
        recipientName: creatorName,
        resourceName: resource.name,
        startTime: start,
        endTime: end,
        status: initialStatus,
        notes
      } : null
    });

    // 3. Send Meeting Invites ONLY if initial status is approved (e.g. auto approve)
    if (initialStatus === 'approved' && attendeesList.length > 0) {
      attendeesList.forEach(async (email) => {
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

    const allowedStatuses = ['approved', 'rejected', 'pending', 'checked_in', 'returned', 'cancelled', 'no_show'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái cập nhật không hợp lệ.' });
    }

    const existingBooking = await Booking.findOne({ _id: id, tenantId: req.user.tenantId });
    if (!existingBooking) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    // Permission check: Employees can only cancel their own bookings
    const currentUserId = (req.user.userId || req.user._id || req.user.id)?.toString();
    const bookingUserId = (existingBooking.userId?._id || existingBooking.userId)?.toString();
    const isOwner = Boolean(bookingUserId && currentUserId && bookingUserId === currentUserId);
    const isManagerOrAdmin = ['manager', 'admin', 'super_admin'].includes(req.user.role);

    if (!isManagerOrAdmin) {
      if (!isOwner || status !== 'cancelled') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' });
      }
    }

    const previousStatus = existingBooking.status;

    // Validate warehouse stock before handing over equipment
    if (status === 'checked_in' && previousStatus !== 'checked_in') {
      const qtyToDeduct = existingBooking.quantity || 1;
      const targetResource = await Resource.findById(existingBooking.resourceId);
      if (!targetResource || (targetResource.quantity || 0) < qtyToDeduct) {
        return res.status(400).json({
          success: false,
          message: `Số lượng thiết bị trong kho không đủ để giao (Hiện còn ${targetResource?.quantity || 0} cái, cần giao ${qtyToDeduct} cái).`
        });
      }
    }

    const updateData = { status };
    if (status === 'checked_in') {
      updateData.checkedInAt = new Date();
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: id, tenantId: req.user.tenantId },
      updateData,
      { new: true }
    ).populate('userId', 'name email violationCount bookingBannedUntil').populate('resourceId', 'name type location');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    // Deduct quantity from Resource when handed over (checked_in)
    if (status === 'checked_in' && previousStatus !== 'checked_in') {
      const qtyToDeduct = booking.quantity || 1;
      await Resource.findByIdAndUpdate(booking.resourceId?._id || booking.resourceId, {
        $inc: { quantity: -qtyToDeduct }
      });
    }
    // Restore quantity to Resource when device is returned or booking reverted/cancelled from checked_in
    else if (previousStatus === 'checked_in' && status !== 'checked_in') {
      const qtyToRestore = booking.quantity || 1;
      await Resource.findByIdAndUpdate(booking.resourceId?._id || booking.resourceId, {
        $inc: { quantity: qtyToRestore }
      });
    }

    // Handle no_show violation penalty
    if (status === 'no_show' && booking.userId) {
      const user = await User.findById(booking.userId._id);
      if (user) {
        user.violationCount = (user.violationCount || 0) + 1;
        if (user.violationCount >= 2) {
          user.bookingBannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days penalty
        }
        await user.save();

        createAndSendNotification({
          tenantId: req.user.tenantId,
          userId: user._id,
          title: `⚠️ Vi phạm không nhận thiết bị / không check-in: ${booking.resourceId?.name || 'Tài nguyên'}`,
          message: `Hệ thống đánh dấu bạn đã không đến nhận thiết bị/check-in đúng hạn. Bạn đã vi phạm ${user.violationCount} lần.${user.violationCount >= 2 ? ` Tài khoản bị tạm cấm đặt tài nguyên trong 7 ngày.` : ''}`,
          type: 'booking_rejected',
          referenceId: booking._id,
          emailData: {
            recipientEmail: user.email,
            recipientName: user.name,
            resourceName: booking.resourceId?.name || 'Tài nguyên',
            location: booking.resourceId?.location || 'Phòng thiết bị',
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: 'no_show',
            notes: `Cảnh báo vi phạm lần thứ ${user.violationCount}`
          }
        });
      }
    }

    // 1. Trigger notification & email to the booking creator (Employee)
    if (booking.userId) {
      const statusText = status === 'approved' ? 'đã được Phê duyệt thành công' : status === 'rejected' ? 'đã bị Từ chối' : 'đã cập nhật về Chờ duyệt';
      const type = status === 'approved' ? 'booking_approved' : status === 'rejected' ? 'booking_rejected' : 'booking_created';

      createAndSendNotification({
        tenantId: req.user.tenantId,
        userId: booking.userId._id,
        title: `Đơn đặt ${booking.resourceId?.name || 'Tài nguyên'} ${statusText}`,
        message: `Đơn mượn/đặt lịch của bạn cho ${booking.resourceId?.name || 'Tài nguyên'} ${statusText}.${status === 'approved' ? ` Vui lòng tới ${booking.resourceId?.location || 'Phòng thiết bị'} để nhận đồ.` : ''}`,
        type,
        referenceId: booking._id,
        emailData: {
          recipientEmail: booking.userId.email,
          recipientName: booking.userId.name,
          resourceName: booking.resourceId?.name || 'Tài nguyên',
          location: booking.resourceId?.location || 'Phòng thiết bị',
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          notes: booking.notes
        }
      });
    }

    // 2. If status is APPROVED, send Meeting Invites to all invited attendees via Email
    if (status === 'approved' && Array.isArray(booking.attendees) && booking.attendees.length > 0) {
      const organizerName = booking.userId ? booking.userId.name : 'Người tạo lịch';
      const resourceName = booking.resourceId ? booking.resourceId.name : 'Phòng họp';

      booking.attendees.forEach(async (email) => {
        sendEmail({
          to: email,
          subject: `[SmartOffice] Thư mời họp: ${resourceName}`,
          html: generateMeetingInviteHtml({
            organizerName,
            resourceName,
            startTime: booking.startTime,
            endTime: booking.endTime,
            notes: booking.notes
          }),
          text: `Thư mời họp từ ${organizerName} tại ${resourceName} lúc ${new Date(booking.startTime).toLocaleString('vi-VN')}`
        });

        const attendeeUser = await User.findOne({ email, tenantId: req.user.tenantId });
        if (attendeeUser) {
          createAndSendNotification({
            tenantId: req.user.tenantId,
            userId: attendeeUser._id,
            title: `Thư mời tham dự họp: ${resourceName}`,
            message: `${organizerName} đã thêm bạn vào danh sách tham dự họp tại ${resourceName} (${new Date(booking.startTime).toLocaleString('vi-VN')}).`,
            type: 'booking_approved',
            referenceId: booking._id
          });
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
