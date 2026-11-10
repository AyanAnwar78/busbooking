const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    seatNumber: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    pnr: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    passengerDetails: [passengerSchema],
    seatNumbers: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one seat must be selected'
      }
    },
    boardingPoint: {
      name: { type: String, required: true },
      time: { type: Date, default: Date.now },
      landmark: { type: String, default: '' }
    },
    droppingPoint: {
      name: { type: String, required: true },
      time: { type: Date, default: Date.now },
      landmark: { type: String, default: '' }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    discountDetails: {
      couponCode: { type: String, default: '' },
      discountAmount: { type: Number, default: 0 }
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PAID'
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED'],
      default: 'CONFIRMED'
    },
    cancellationDetails: {
      cancelledAt: { type: Date, default: null },
      refundAmount: { type: Number, default: 0 },
      refundPercentage: { type: Number, default: 0 },
      cancellationFee: { type: Number, default: 0 },
      refundStatus: {
        type: String,
        enum: ['NONE', 'PENDING', 'PROCESSED'],
        default: 'NONE'
      },
      reason: { type: String, default: '' }
    },
    contactPhone: {
      type: String,
      required: true
    },
    contactEmail: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ trip: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
