const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
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
    basePriceMultiplier: {
      type: Number,
      default: 1.0
    }
  },
  { _id: false }
);

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Please provide vehicle registration number'],
      unique: true,
      trim: true,
      uppercase: true
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operator',
      required: [true, 'Bus must belong to an operator']
    },
    busType: {
      type: String,
      enum: ['AC Sleeper (2+1)', 'AC Seater (2+2)', 'Non-AC Seater (2+2)', 'Volvo Multi-Axle AC', 'Electric AC Seater'],
      default: 'AC Seater (2+2)'
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 60
    },
    layoutType: {
      type: String,
      enum: ['2x2', '2x1', 'sleeper_2x1'],
      default: '2x2'
    },
    seats: [seatSchema],
    amenities: {
      type: [String],
      default: ['WiFi', 'Charging Point', 'Water Bottle', 'Reading Light', 'Live Tracking']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Bus', busSchema);
