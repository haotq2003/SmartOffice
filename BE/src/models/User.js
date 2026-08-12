const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'manager', 'employee'],
      default: 'employee',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
