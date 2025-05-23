const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema(
  {
    adTitle: {
      type: String,
      required: [true, 'Ad title is required'],
      minlength: [5, 'Ad title must be between 5 and 60 characters'],
      maxlength: [60, 'Ad title must be between 5 and 60 characters'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      minlength: [2, 'City name must be at least 2 characters'],
      trim: true,
      index: true, // Index for faster city filtering/sorting
    },
    streetName: {
      type: String,
      required: [true, 'Street name is required'],
      minlength: [2, 'Street name must be at least 2 characters'],
      trim: true,
    },
    streetNumber: {
      type: Number,
      required: [true, 'Street number is required'],
      min: [1, 'Street number must be a positive number'],
    },
    areaSize: {
      type: Number,
      required: [true, 'Area size is required'],
      min: [1, 'Area size must be a valid positive number'],
      index: true, // Index for area size range queries
    },
    hasAC: {
      type: Boolean,
      default: false,
      required: [true, 'AC status is required'],
    },
    yearBuilt: {
      type: Number,
      required: [true, 'Year built is required'],
      min: [1900, 'Year built must be between 1900 and current year'],
      max: [new Date().getFullYear(), 'Year built must be between 1900 and current year'],
    },
    rentPrice: {
      type: Number,
      required: [true, 'Rent price is required'],
      min: [0.01, 'Rent price must be greater than zero'],
      index: true, // Index for price range queries and sorting
    },
    dateAvailable: {
      type: Number, // not Date!
      required: [true, 'Date available is required'],
    },
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: [],
      },
    ],
  },
  { timestamps: true }
);

// Compound indexes for combined filtering
flatSchema.index({ city: 1, rentPrice: 1 }); // Optimized for queries like { city: "X", rentPrice: { $lte: Y } }
flatSchema.index({ city: 1, areaSize: 1 }); // Optimized for queries like { city: "X", areaSize: { $gte: Y } }

module.exports = mongoose.model('Flat', flatSchema);
