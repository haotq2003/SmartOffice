const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const { sendEmail, generateBookingEmailHtml } = require('./emailService');
const User = require('../models/User');

/**
 * Create and dispatch notification via Socket.io & Email
 */
const createAndSendNotification = async ({
  tenantId,
  userId,
  title,
  message,
  type = 'booking_created',
  referenceId = null,
  targetRole = null, // 'managers' or null (specific user)
  emailData = null, // { recipientEmail, recipientName, resourceName, startTime, endTime, status, notes }
}) => {
  try {
    // 1. If targetRole is 'managers', notify all managers/admins of the tenant
    if (targetRole === 'managers') {
      const managers = await User.find({
        tenantId,
        role: { $in: ['manager', 'admin', 'super_admin'] },
      });

      const notifications = await Promise.all(
        managers.map(async (m) => {
          return await Notification.create({
            tenantId,
            userId: m._id,
            title,
            message,
            type,
            referenceId,
          });
        })
      );

      // Emit Socket event to manager room
      try {
        const io = getIO();
        io.to(`tenant_${tenantId}_managers`).emit('notification:new', {
          count: notifications.length,
          title,
          message,
          type,
          referenceId,
          createdAt: new Date(),
        });
      } catch (err) {
        console.warn('Socket emit warning:', err.message);
      }

      // Send Email to managers (async non-blocking)
      if (emailData) {
        managers.forEach((m) => {
          if (m.email) {
            sendEmail({
              to: m.email,
              subject: `[SmartOffice] ${title}`,
              html: generateBookingEmailHtml({
                recipientName: m.name || 'Quản lý',
                ...emailData,
              }),
              text: `${title}: ${message}`,
            });
          }
        });
      }

      return notifications;
    }

    // 2. Specific User Notification
    if (!userId) return null;

    const notification = await Notification.create({
      tenantId,
      userId,
      title,
      message,
      type,
      referenceId,
    });

    // Emit Socket event to specific user room
    try {
      const io = getIO();
      io.to(`user_${userId}`).emit('notification:new', {
        notificationId: notification._id,
        title,
        message,
        type,
        referenceId,
        createdAt: notification.createdAt,
      });
    } catch (err) {
      console.warn('Socket emit warning:', err.message);
    }

    // Send Email to User (async non-blocking)
    if (emailData && emailData.recipientEmail) {
      sendEmail({
        to: emailData.recipientEmail,
        subject: `[SmartOffice] ${title}`,
        html: generateBookingEmailHtml({
          recipientName: emailData.recipientName || 'Người dùng',
          ...emailData,
        }),
        text: `${title}: ${message}`,
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating/sending notification:', error);
    return null;
  }
};

module.exports = {
  createAndSendNotification,
};
