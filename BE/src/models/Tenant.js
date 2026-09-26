const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      unique: true,
    },
    plan: {
      type: String,
      default: 'none',
    },
    planExpiredAt: {
      type: Date,
      default: null,
    },
    monthlyRevenue: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending_payment'],
      default: 'pending_payment',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tenant', tenantSchema);
