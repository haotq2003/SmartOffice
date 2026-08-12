const Tenant = require('../models/Tenant');
const User = require('../models/User');

const getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });

    // Include statistics for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const totalUsers = await User.countDocuments({ tenantId: tenant._id });
        return {
          ...tenant.toObject(),
          totalUsers,
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

    if (!['free', 'premium', 'enterprise'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan type.' });
    }

    const tenant = await Tenant.findByIdAndUpdate(id, { plan }, { new: true });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found.' });
    }

    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllTenants, updateTenantPlan };
