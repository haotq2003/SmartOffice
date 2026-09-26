const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

const Tenant = require('../models/Tenant');

const checkSubscriptionStatus = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return next();
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Doanh nghiệp không tồn tại.' });
    }

    const now = new Date();
    if (tenant.planExpiredAt && new Date(tenant.planExpiredAt) < now && tenant.status === 'active') {
      tenant.status = 'suspended';
      await tenant.save().catch(e => console.error(e));
    }

    const hasActiveSubscription = tenant.status === 'active' && 
      tenant.plan !== 'none' && 
      tenant.planExpiredAt && 
      new Date(tenant.planExpiredAt) > now;

    if (!hasActiveSubscription) {
      const allowedPaths = ['/me', '/create-momo-url', '/momo-return', '/create-vnpay-url', '/vnpay-return', '/transactions', '/plans'];
      const isAllowed = allowedPaths.some(p => req.originalUrl.includes(p));

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          requiresSubscription: true,
          message: tenant.status === 'pending_payment' || tenant.plan === 'none'
            ? 'Doanh nghiệp chưa kích hoạt gói cước. Bắt buộc phải mua gói dịch vụ mới có thể sử dụng hệ thống SmartOffice.'
            : 'Gói cước dịch vụ của doanh nghiệp bạn đã hết hạn. Vui lòng gia hạn gói cước để tiếp tục sử dụng hệ thống.'
        });
      }
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Error in checkSubscriptionStatus middleware:', error);
    next();
  }
};

module.exports = { verifyToken, authorizeRoles, checkSubscriptionStatus };
