const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

const registerTenant = async (req, res) => {
  try {
    const { tenantName, domain, adminName, adminEmail, adminPassword } = req.body;

    // Check if domain or adminEmail already exists
    const existingTenant = await Tenant.findOne({ domain });
    if (existingTenant) {
      return res.status(400).json({ success: false, message: 'Domain already in use.' });
    }

    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    // Create Tenant
    const tenant = await Tenant.create({ name: tenantName, domain, plan: 'free' });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create Admin User
    const user = await User.create({
      tenantId: tenant._id,
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });

    res.status(201).json({
      success: true,
      data: {
        tenant: { _id: tenant._id, name: tenant.name, domain: tenant.domain },
        user: { _id: user._id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT
    const payload = {
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!['manager', 'employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Only manager or employee is allowed.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User with admin's tenantId
    const user = await User.create({
      tenantId: req.user.tenantId,
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.user.tenantId }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerTenant, login, createUser, getUsers };
