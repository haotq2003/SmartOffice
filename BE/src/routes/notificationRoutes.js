const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getNotifications);
router.get('/unread-count', verifyToken, getUnreadCount);
router.patch('/read-all', verifyToken, markAllAsRead);
router.patch('/:id/read', verifyToken, markAsRead);

module.exports = router;
