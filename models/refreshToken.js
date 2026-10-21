const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  jti: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  replacedBy: { type: String, default: null },
  ip: String,
  userAgent: String
}, { timestamps: true });

// Optimized for token rotation queries and background pruning
refreshTokenSchema.index({ user: 1, jti: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Automatic DB purging

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
