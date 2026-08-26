const Plan = require('../models/Plan');
const Tenant = require('../models/Tenant');


const getAllPlans = async (req, res) => {
    try {
        const plan = await Plan.find().sort({ price: 1 })
        return res.status(200).json({ success: true, message: "Plans fetched successfully", data: plan })
    } catch (error) {
        console.error("Error in getAllPlans:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

const getPlanById = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id)
        return res.status(200).json({ success: true, message: "Plan fetched successfully", data: plan })
    } catch (error) {
        console.error("Error in getPlanById:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
const createPlan = async (req, res) => {
    try {
        const {
            name,
            code,
            price,
            maxUsers,
            maxResources,
            features,
            description
        } = req.body;

        const existingPlan = await Plan.findOne({ code });

        if (existingPlan) {
            return res.status(400).json({
                success: false,
                message: "Mã gói cước (code) đã tồn tại."
            });
        }

        const plan = await Plan.create({
            name,
            code,
            price,
            maxUsers,
            maxResources,
            features,
            description
        });

        return res.status(201).json({
            success: true,
            message: "Tạo gói cước thành công.",
            data: plan
        });

    } catch (error) {
        console.error("Error in createPlan:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói cước.' });
    }
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói cước.' });
    }
    // Kiểm tra xem có công ty nào đang dùng mã gói này không
    const activeTenants = await Tenant.countDocuments({ plan: plan.code });
    if (activeTenants > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa! Đang có ${activeTenants} doanh nghiệp đang sử dụng gói này.`
      });
    }
    await Plan.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Đã xóa gói cước thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = {
    getAllPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan
}