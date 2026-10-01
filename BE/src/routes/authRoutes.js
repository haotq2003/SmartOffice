const express = require('express');
const {
  registerTenant,
  login,
  getMe,
  createUser,
  getUsers,
  getAllSystemUsers,
  createSystemUser,
  updateSystemUser,
  resetUserPassword,
  deleteSystemUser,
} = require('../controllers/authController');
const { verifyToken, authorizeRoles, checkSubscriptionStatus } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register-tenant:
 *   post:
 *     summary: Register a new tenant and admin user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantName
 *               - domain
 *               - adminName
 *               - adminEmail
 *               - adminPassword
 *             properties:
 *               tenantName:
 *                 type: string
 *               domain:
 *                 type: string
 *               adminName:
 *                 type: string
 *               adminEmail:
 *                 type: string
 *                 format: email
 *               adminPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Tenant and admin user successfully registered
 *       400:
 *         description: Domain or email already in use
 *       500:
 *         description: Server error
 */
router.post('/register-tenant', registerTenant);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */
router.post('/login', login);
router.get('/me', verifyToken, getMe);

/**
 * @swagger
 * /api/auth/create-user:
 *   post:
 *     summary: Create a new manager or employee account (Admin only)
 *     tags: [Auth]
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
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [manager, employee]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or email already in use
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 *       500:
 *         description: Server error
 */
router.post('/create-user', verifyToken, authorizeRoles('admin'), checkSubscriptionStatus, createUser);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Retrieve all users in the tenant (Admin & Manager only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tenant users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/users', verifyToken, authorizeRoles('admin', 'manager'), getUsers);

// Super Admin: System-wide User Management
router.get('/system-users', verifyToken, authorizeRoles('super_admin'), getAllSystemUsers);
router.post('/system-users', verifyToken, authorizeRoles('super_admin'), createSystemUser);
router.patch('/system-users/:id', verifyToken, authorizeRoles('super_admin'), updateSystemUser);
router.patch('/system-users/:id/reset-password', verifyToken, authorizeRoles('super_admin'), resetUserPassword);
router.delete('/system-users/:id', verifyToken, authorizeRoles('super_admin'), deleteSystemUser);

module.exports = router;
