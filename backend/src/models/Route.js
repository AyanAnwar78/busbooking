const mongoose = require('mongoose');

const stopPointSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    landmark: {
      type: String,
      default: ''
    },
    timeOffsetMinutes: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    origin: {
      type: String,
      required: [true, 'Please provide origin city'],
      trim: true
    },
    destination: {
      type: String,
      required: [true, 'Please provide destination city'],
      trim: true
    },
    distanceKm: {
      type: Number,
      required: true
    },
    estimatedDurationMinutes: {
      type: Number,
      required: true
    },
    boardingPoints: [stopPointSchema],
    droppingPoints: [stopPointSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast route search
routeSchema.index({ origin: 1, destination: 1 });

module.exports = mongoose.model('Route', routeSchema);

