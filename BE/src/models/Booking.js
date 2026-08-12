const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
    },
    attendees: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
