const express = require('express');
const router = express.Router();
const { getAllTenants, updateTenantPlan } = require('../controllers/tenantController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Super Admin Tenant management API
 */

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Retrieve all tenants (Super Admin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all registered tenants with user statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Super Admin only)
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, authorizeRoles('super_admin'), getAllTenants);

/**
 * @swagger
 * /api/tenants/{id}/plan:
 *   patch:
 *     summary: Update tenant subscription plan (Super Admin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [free, premium, enterprise]
 *     responses:
 *       200:
 *         description: Tenant plan updated successfully
 *       400:
 *         description: Invalid plan
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/plan', verifyToken, authorizeRoles('super_admin'), updateTenantPlan);

module.exports = router;
