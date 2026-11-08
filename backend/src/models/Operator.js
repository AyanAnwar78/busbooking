const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide operator company name'],
      trim: true,
      unique: true
    },
    contactEmail: {
      type: String,
      required: [true, 'Please provide contact email'],
      lowercase: true,
      trim: true
    },
    contactPhone: {
      type: String,
      required: [true, 'Please provide contact phone']
    },
    licenseNumber: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5
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

module.exports = mongoose.model('Operator', operatorSchema);

