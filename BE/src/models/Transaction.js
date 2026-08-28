const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    planCode: {
      type: String,
      required: true,
    },
    amountUSD: {
      type: Number,
      required: true,
    },
    amountVND: {
      type: Number,
      required: true,
    },
    months: {
      type: Number,
      default: 12,
    },
    paymentMethod: {
      type: String,
      enum: ['vnpay', 'momo', 'manual', 'mock'],
      default: 'momo',
    },
    transactionRef: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed'],
      default: 'success',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
