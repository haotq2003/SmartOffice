const express = require('express');
const router = express.Router();
const { getAllPlans, getPlanById, createPlan, updatePlan, deletePlan } = require('../controllers/planController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Subscription Plans management API
 */

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Retrieve all subscription plans
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: List of subscription plans
 *       500:
 *         description: Server error
 */
router.get('/', getAllPlans);

/**
 * @swagger
 * /api/plans/{id}:
 *   get:
 *     summary: Get a specific subscription plan by ID
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ObjectId
 *     responses:
 *       200:
 *         description: Subscription plan details
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getPlanById);

/**
 * @swagger
 * /api/plans:
 *   post:
 *     summary: Create a new subscription plan (Super Admin only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gói Chuyên Nghiệp (Premium)
 *               code:
 *                 type: string
 *                 enum: [free, premium, enterprise, pro, vip]
 *                 example: premium
 *               price:
 *                 type: number
 *                 example: 49
 *               maxUsers:
 *                 type: number
 *                 example: 100
 *               maxResources:
 *                 type: number
 *                 example: 25
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Đặt phòng họp theo giờ", "Mượn thiết bị theo ngày", "Hỗ trợ 24/7"]
 *               description:
 *                 type: string
 *                 example: Phù hợp cho các doanh nghiệp vừa và nhỏ.
 *     responses:
 *       201:
 *         description: Subscription plan created successfully
 *       400:
 *         description: Duplicate plan code or invalid parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Super Admin only)
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, authorizeRoles('super_admin'), createPlan);

/**
 * @swagger
 * /api/plans/{id}:
 *   put:
 *     summary: Update an existing subscription plan (Super Admin only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               maxUsers:
 *                 type: number
 *               maxResources:
 *                 type: number
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription plan updated successfully
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Server error
 */
router.put('/:id', verifyToken, authorizeRoles('super_admin'), updatePlan);

/**
 * @swagger
 * /api/plans/{id}:
 *   delete:
 *     summary: Delete a subscription plan (Super Admin only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ObjectId
 *     responses:
 *       200:
 *         description: Subscription plan deleted successfully
 *       400:
 *         description: Cannot delete plan if active tenants are using it
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', verifyToken, authorizeRoles('super_admin'), deletePlan);

module.exports = router;
