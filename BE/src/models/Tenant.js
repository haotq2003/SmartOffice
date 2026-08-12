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
      enum: ['free', 'premium', 'enterprise'],
      default: 'free',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tenant', tenantSchema);
