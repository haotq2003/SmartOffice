const express = require('express');
const router = express.Router();
const { handleSmartBookingChat } = require('../controllers/aiController');
const { verifyToken, checkSubscriptionStatus } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/ai/smart-booking:
 *   post:
 *     summary: AI Smart Booking Assistant - Tìm kiếm và đặt phòng bằng ngôn ngữ tự nhiên (Gemini Function Calling)
 *     tags: [AI Assistant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "Tìm cho tôi phòng họp 10 người có máy chiếu vào 14:00 chiều mai"
 *     responses:
 *       200:
 *         description: Trả về câu trả lời tự nhiên kèm danh sách phòng còn trống thực tế
 *       400:
 *         description: Thiếu prompt hoặc tenantId
 *       500:
 *         description: Lỗi máy chủ hoặc API Gemini
 */
router.post('/smart-booking', verifyToken, checkSubscriptionStatus, handleSmartBookingChat);

module.exports = router;
