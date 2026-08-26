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

module.exports = { getAllTenants, updateTenantPlan };
