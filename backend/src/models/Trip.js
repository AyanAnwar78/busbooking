const mongoose = require('mongoose');

const tripSeatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true
    },
    row: {
      type: Number,
      required: true
    },
    col: {
      type: Number,
      required: true
    },
    tier: {
      type: String,
      enum: ['lower', 'upper'],
      default: 'lower'
    },
    type: {
      type: String,
      enum: ['seater', 'sleeper', 'semi-sleeper'],
      default: 'seater'
    },
    fare: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'BOOKED'],
      default: 'AVAILABLE'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    }
  },
  { _id: false }
);

const cancellationRuleSchema = new mongoose.Schema(
  {
    minHoursBefore: {
      type: Number,
      required: true
    },
    refundPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    tripCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required']
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operator',
      required: [true, 'Operator reference is required']
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route reference is required']
    },
    departureTime: {
      type: Date,
      required: [true, 'Departure time is required']
    },
    arrivalTime: {
      type: Date,
      required: [true, 'Arrival time is required']
    },
    baseFare: {
      type: Number,
      required: [true, 'Base fare is required'],
      min: 0
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED'
    },
    seats: [tripSeatSchema],
    totalSeats: {
      type: Number,
      required: true
    },
    availableSeatCount: {
      type: Number,
      required: true
    },
    cancellationPolicy: {
      rules: {
        type: [cancellationRuleSchema],
        default: [
          { minHoursBefore: 24, refundPercentage: 90 },
          { minHoursBefore: 12, refundPercentage: 50 },
          { minHoursBefore: 0, refundPercentage: 0 }
        ]
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for searching trips efficiently
tripSchema.index({ route: 1, departureTime: 1, status: 1 });
tripSchema.index({ operator: 1, departureTime: 1 });

module.exports = mongoose.model('Trip', tripSchema);

