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

    // Create Tenant requiring subscription purchase
    const tenant = await Tenant.create({
      name: tenantName,
      domain,
      plan: 'none',
      status: 'pending_payment',
      planExpiredAt: null,
    });

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

    // Generate JWT for newly registered admin user
    const payload = {
      userId: user._id,
      tenantId: tenant._id,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      success: true,
      message: 'Đăng ký doanh nghiệp thành công! Vui lòng chọn gói cước để kích hoạt hệ thống.',
      data: {
        token,
        tenant: {
          _id: tenant._id,
          name: tenant.name,
          domain: tenant.domain,
          plan: tenant.plan,
          status: tenant.status,
          planExpiredAt: tenant.planExpiredAt,
        },
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: tenant._id,
          companyName: tenant.name,
          tenant: {
            _id: tenant._id,
            name: tenant.name,
            domain: tenant.domain,
            plan: tenant.plan,
            status: tenant.status,
            planExpiredAt: tenant.planExpiredAt,
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check User & populate tenant details
    const user = await User.findOne({ email }).populate('tenantId', 'name domain plan status planExpiredAt');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const tenantObj = user.tenantId && typeof user.tenantId === 'object' && user.tenantId.name ? user.tenantId : null;
    const tenantIdVal = tenantObj ? tenantObj._id : (user.tenantId || null);

    // Generate JWT
    const payload = {
      userId: user._id,
      tenantId: tenantIdVal,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    const companyName = tenantObj ? tenantObj.name : (user.role === 'super_admin' ? 'Hệ thống SmartOffice' : 'Chưa phân bổ');

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: tenantIdVal,
          companyName,
          tenant: tenantObj ? {
            _id: tenantObj._id,
            name: tenantObj.name,
            domain: tenantObj.domain,
            plan: tenantObj.plan,
            status: tenantObj.status,
            planExpiredAt: tenantObj.planExpiredAt,
          } : null,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('tenantId', 'name domain plan status planExpiredAt')
      .select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const tenantObj = user.tenantId && typeof user.tenantId === 'object' && user.tenantId.name ? user.tenantId : null;
    const tenantIdVal = tenantObj ? tenantObj._id : (user.tenantId || null);
    const companyName = tenantObj ? tenantObj.name : (user.role === 'super_admin' ? 'Hệ thống SmartOffice' : 'Chưa phân bổ');

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenantIdVal,
        companyName,
        tenant: tenantObj ? {
          _id: tenantObj._id,
          name: tenantObj.name,
          domain: tenantObj.domain,
          plan: tenantObj.plan,
          status: tenantObj.status,
          planExpiredAt: tenantObj.planExpiredAt,
        } : null,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, rfidCardId } = req.body;

    // Validate role
    if (!['manager', 'employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Only manager or employee is allowed.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    // Generate or validate RFID Card ID
    let assignedRfid = rfidCardId ? String(rfidCardId).trim().toUpperCase() : '';
    if (assignedRfid) {
      const existingCard = await User.findOne({ rfidCardId: assignedRfid });
      if (existingCard) {
        return res.status(400).json({ success: false, message: `Mã thẻ RFID "${assignedRfid}" đã được gán cho nhân viên khác.` });
      }
    } else {
      // Auto-generate a unique RFID Card ID: RFID-XXXX
      let isUnique = false;
      while (!isUnique) {
        const candidate = `RFID-${Math.floor(1000 + Math.random() * 9000)}`;
        const exists = await User.findOne({ rfidCardId: candidate });
        if (!exists) {
          assignedRfid = candidate;
          isUnique = true;
        }
      }
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
      rfidCardId: assignedRfid,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        rfidCardId: user.rfidCardId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.user.tenantId })
      .populate('tenantId', 'name domain plan')
      .select('-password')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Super Admin: Get all users across the entire system with filters
 */
const getAllSystemUsers = async (req, res) => {
  try {
    const { search, role, tenantId } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (tenantId && tenantId !== 'all') {
      query.tenantId = tenantId;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { rfidCardId: searchRegex },
      ];
    }

    const users = await User.find(query)
      .populate('tenantId', 'name domain plan status')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Super Admin: Update user information (role, rfidCardId, clear violations, etc.)
 */
const updateSystemUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, rfidCardId, name, clearViolations } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    if (role && ['super_admin', 'admin', 'manager', 'employee'].includes(role)) {
      user.role = role;
    }

    if (name) {
      user.name = name.trim();
    }

    if (rfidCardId !== undefined) {
      const trimmed = String(rfidCardId).trim();
      if (trimmed) {
        const existing = await User.findOne({ rfidCardId: trimmed, _id: { $ne: id } });
        if (existing) {
          return res.status(400).json({ success: false, message: `Mã thẻ RFID "${trimmed}" đã được sử dụng bởi người khác.` });
        }
        user.rfidCardId = trimmed;
      }
    }

    if (clearViolations) {
      user.violationCount = 0;
      user.bookingBannedUntil = null;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật tài khoản thành công.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rfidCardId: user.rfidCardId,
        violationCount: user.violationCount,
        bookingBannedUntil: user.bookingBannedUntil,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Super Admin: Reset password for any user
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const pwdToSet = newPassword?.trim() || '123456';
    if (pwdToSet.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pwdToSet, salt);

    const user = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    res.status(200).json({
      success: true,
      message: `Đã đặt lại mật khẩu thành công cho ${user.email}. Mật khẩu mới là: ${pwdToSet}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Super Admin: Delete user from system
 */
const deleteSystemUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = (req.user.userId || req.user._id || req.user.id)?.toString();

    if (id === currentUserId) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự xóa tài khoản của chính mình.' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    res.status(200).json({ success: true, message: `Đã xóa tài khoản ${user.email} khỏi hệ thống.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Super Admin: Create a new user for any tenant or another super_admin
 */
const createSystemUser = async (req, res) => {
  try {
    const { name, email, password, role, tenantId, rfidCardId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ Tên, Email, Mật khẩu và Vai trò.' });
    }

    if (role !== 'super_admin' && !tenantId) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn Doanh nghiệp trực thuộc cho tài khoản này.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng trên hệ thống.' });
    }

    // Generate or validate RFID Card ID
    let assignedRfid = rfidCardId ? String(rfidCardId).trim().toUpperCase() : '';
    if (assignedRfid) {
      const existingCard = await User.findOne({ rfidCardId: assignedRfid });
      if (existingCard) {
        return res.status(400).json({ success: false, message: `Mã thẻ RFID "${assignedRfid}" đã được gán cho tài khoản khác.` });
      }
    } else {
      let isUnique = false;
      while (!isUnique) {
        const candidate = `RFID-${Math.floor(1000 + Math.random() * 9000)}`;
        const exists = await User.findOne({ rfidCardId: candidate });
        if (!exists) {
          assignedRfid = candidate;
          isUnique = true;
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      tenantId: role === 'super_admin' ? (tenantId || null) : tenantId,
      name,
      email,
      password: hashedPassword,
      role,
      rfidCardId: assignedRfid,
    });

    const populatedUser = await User.findById(newUser._id)
      .populate('tenantId', 'name domain plan status')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công.',
      data: populatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
