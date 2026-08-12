const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId, tenantId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ userId, tenantId });
    const unreadCount = await Notification.countDocuments({ userId, tenantId, isRead: false });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const count = await Notification.countDocuments({ userId, tenantId, isRead: false });

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, tenantId } = req.user;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId, tenantId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;

    await Notification.updateMany({ userId, tenantId, isRead: false }, { isRead: true });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
