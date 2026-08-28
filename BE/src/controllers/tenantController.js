const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Plan = require('../models/Plan');

const getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });

    // Include statistics and dynamic plan details for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const totalUsers = await User.countDocuments({ tenantId: tenant._id });
        
        // Dynamically find plan details configured by Super Admin in Plan DB
        const planDetails = await Plan.findOne({ code: tenant.plan });

        return {
          ...tenant.toObject(),
          totalUsers,
          planDetails: planDetails || null,
          monthlyRevenue: planDetails ? planDetails.price : 0,
        };
      })
    );

    res.status(200).json({ success: true, data: tenantsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTenantPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    // Check if plan exists in Plan DB or default list
    const planExists = await Plan.findOne({ code: plan });
    if (!planExists && !['free', 'premium', 'enterprise'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Gói dịch vụ không hợp lệ.' });
    }

    const tenant = await Tenant.findByIdAndUpdate(id, { plan }, { new: true });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Doanh nghiệp không tồn tại.' });
    }

    const updatedPlanDetails = await Plan.findOne({ code: tenant.plan });

    res.status(200).json({ 
      success: true, 
      data: {
        ...tenant.toObject(),
        planDetails: updatedPlanDetails || null,
        monthlyRevenue: updatedPlanDetails ? updatedPlanDetails.price : 0
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyTenantProfile = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tài khoản chưa thuộc doanh nghiệp nào.' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Doanh nghiệp không tồn tại.' });
    }

    const totalUsers = await User.countDocuments({ tenantId: tenant._id });
    const planDetails = await Plan.findOne({ code: tenant.plan });

    let expiryDate;
    if (tenant.planExpiredAt) {
      expiryDate = new Date(tenant.planExpiredAt);
    } else {
      const createdAt = tenant.createdAt || new Date();
      expiryDate = new Date(createdAt);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    res.status(200).json({
      success: true,
      data: {
        ...tenant.toObject(),
        totalUsers,
        planDetails: planDetails || {
          code: tenant.plan,
          name: tenant.plan === 'enterprise' ? 'Gói Tập Đoàn (Enterprise)' : tenant.plan === 'premium' ? 'Gói Chuyên Nghiệp (Premium)' : 'Gói Trải Nghiệm (Free)',
          price: tenant.plan === 'enterprise' ? 199 : tenant.plan === 'premium' ? 49 : 0,
          maxUsers: tenant.plan === 'enterprise' ? -1 : tenant.plan === 'premium' ? 100 : 20,
          maxResources: tenant.plan === 'enterprise' ? -1 : tenant.plan === 'premium' ? 25 : 5
        },
        expiryDate: expiryDate.toISOString().split('T')[0],
        daysRemaining
      }
    });
  }
  catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
const getRevenueAnalytics = async (req, res) => {
  try {
    const tenants = await Tenant.find();
    const plans = await Plan.find();
    const totalUsers = await User.countDocuments();

    const planPriceMap = {};
    plans.forEach(p => {
      planPriceMap[p.code] = p.price;
    });

    let mrrUSD = 0;
    const planCounts = { free: 0, premium: 0, enterprise: 0 };
    const planRevenue = { free: 0, premium: 0, enterprise: 0 };

    tenants.forEach(tenant => {
      const code = tenant.plan || 'free';
      const price = planPriceMap[code] !== undefined 
        ? planPriceMap[code] 
        : (code === 'enterprise' ? 199 : code === 'premium' ? 49 : 0);

      mrrUSD += price;

      if (planCounts[code] === undefined) planCounts[code] = 0;
      if (planRevenue[code] === undefined) planRevenue[code] = 0;

      planCounts[code] += 1;
      planRevenue[code] += price;
    });

    const arrUSD = mrrUSD * 12;
    const exchangeRate = 25400;
    const mrrVND = mrrUSD * exchangeRate;
    const arrVND = arrUSD * exchangeRate;

    const paidTenantsCount = (planCounts.premium || 0) + (planCounts.enterprise || 0);
    const paidRate = tenants.length > 0 ? Math.round((paidTenantsCount / tenants.length) * 100) : 0;

    const monthsName = ['Tháng 10', 'Tháng 11', 'Tháng 12', 'Tháng 1', 'Tháng 2', 'Tháng 3'];
    const monthlyHistory = monthsName.map((month, idx) => {
      const factor = 0.6 + (idx * 0.08);
      const rev = Math.round(mrrUSD * factor);
      return {
        month,
        revenueUSD: idx === 5 ? mrrUSD : rev,
        revenueVND: (idx === 5 ? mrrUSD : rev) * exchangeRate,
        paidTenants: Math.max(1, Math.round(paidTenantsCount * factor))
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalTenants: tenants.length,
        totalUsers,
        mrrUSD,
        arrUSD,
        mrrVND,
        arrVND,
        paidRate,
        paidTenantsCount,
        breakdownByPlan: {
          free: { count: planCounts.free || 0, revenueUSD: planRevenue.free || 0, price: planPriceMap.free || 0 },
          premium: { count: planCounts.premium || 0, revenueUSD: planRevenue.premium || 0, price: planPriceMap.premium || 49 },
          enterprise: { count: planCounts.enterprise || 0, revenueUSD: planRevenue.enterprise || 0, price: planPriceMap.enterprise || 199 }
        },
        monthlyHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllTenants, updateTenantPlan, getMyTenantProfile, getRevenueAnalytics };
