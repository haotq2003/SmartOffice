const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true, // free, premium, enterprise
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    maxUsers: {
      type: Number,
      default: 20, // -1 là không giới hạn
    },
    maxResources: {
      type: Number,
      default: 5, // -1 là không giới hạn
    },
    features: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
