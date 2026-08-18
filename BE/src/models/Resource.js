const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
    },
    name: {
      type: String,
    },
    type: {
      type: String,
      enum: ['room', 'equipment', 'vehicle'],
    },
    capacity: {
      type: Number,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    location: {
      type: String,
    },
    description: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    isAutoApprove: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['available', 'maintenance'],
      default: 'available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);
