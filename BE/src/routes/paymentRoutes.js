const express = require('express');
const router = express.Router();
const { createPaymentUrl, vnpayReturn, createMomoUrl, verifyMomoReturn, getAllTransactions } = require('../controllers/paymentController');

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: VNPay & MoMo Payment Gateway Operations API
 */

/**
 * @swagger
 * /api/payment/transactions:
 *   get:
 *     summary: Lấy danh sách lịch sử giao dịch nạp tiền / thanh toán
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại (ví dụ 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bản ghi mỗi trang (ví dụ 10)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, pending, failed]
 *         description: Lọc theo trạng thái giao dịch
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [vnpay, momo, manual, mock]
 *         description: Lọc theo phương thức thanh toán
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mã giao dịch hoặc mã gói cước
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Lọc theo ObjectId của Tenant
 *     responses:
 *       200:
 *         description: Lấy danh sách giao dịch thành công kèm thông tin tổng doanh thu và phân trang
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
router.get('/transactions', getAllTransactions);

/**
 * @swagger
 * /api/payment/create-vnpay-url:
 *   post:
 *     summary: Khởi tạo URL chuyển hướng thanh toán qua VNPay Sandbox
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planCode
 *               - priceUSD
 *             properties:
 *               planCode:
 *                 type: string
 *                 enum: [free, premium, enterprise]
 *                 example: enterprise
 *               priceUSD:
 *                 type: number
 *                 example: 199
 *               months:
 *                 type: number
 *                 example: 12
 *     responses:
 *       200:
 *         description: Khởi tạo URL thanh toán VNPay thành công
 */
router.post('/create-vnpay-url', createPaymentUrl);

/**
 * @swagger
 * /api/payment/vnpay-return:
 *   get:
 *     summary: Xác thực kết quả thanh toán VNPay
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Kết quả xác thực VNPay
 */
router.get('/vnpay-return', vnpayReturn);

/**
 * @swagger
 * /api/payment/create-momo-url:
 *   post:
 *     summary: Khởi tạo URL thanh toán qua Ví MoMo Sandbox
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planCode
 *               - priceUSD
 *             properties:
 *               planCode:
 *                 type: string
 *                 example: premium
 *               priceUSD:
 *                 type: number
 *                 example: 49
 *               months:
 *                 type: number
 *                 example: 12
 *     responses:
 *       200:
 *         description: Khởi tạo URL MoMo thành công (Trả về payUrl)
 */
router.post('/create-momo-url', createMomoUrl);

/**
 * @swagger
 * /api/payment/momo-return:
 *   get:
 *     summary: Xác thực kết quả thanh toán MoMo Sandbox
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Kết quả xác thực MoMo
 */
router.get('/momo-return', verifyMomoReturn);

module.exports = router;
