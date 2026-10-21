const mongoose = require('mongoose');

const sportsDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true }, // Normalized to midnight UTC
  metrics: {
    steps: { type: Number, default: 0, min: 0 },
    distanceKm: { type: Number, default: 0, min: 0 },
    caloriesBurned: { type: Number, default: 0, min: 0 },
    activeMinutes: { type: Number, default: 0, min: 0 }
  },
  vitals: {
    averageHeartRate: { type: Number, min: 0 },
    peakHeartRate: { type: Number, min: 0 },
    restingHeartRate: { type: Number, min: 0 }
  }
}, { timestamps: true });

// Compound unique constraint: A single user can only have ONE entry per calendar date range
sportsDataSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('SportsData', sportsDataSchema);
