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
    if (tenant.planExpiredAt && new Date(tenant.planExpiredAt) < now && tenant.status !== 'suspended') {
      tenant.status = 'suspended';
      await tenant.save().catch(e => console.error(e));
    }

    if (tenant.status === 'suspended') {
      const allowedPathsForSuspended = ['/me', '/create-momo-url', '/momo-return', '/create-vnpay-url', '/vnpay-return', '/transactions'];
      const isAllowed = allowedPathsForSuspended.some(p => req.originalUrl.includes(p));

      if (!isAllowed && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        return res.status(403).json({
          success: false,
          isExpired: true,
          message: 'Gói cước dịch vụ của doanh nghiệp bạn đã hết hạn. Vui lòng gia hạn gói cước qua Ví MoMo để tiếp tục sử dụng hệ thống.'
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
