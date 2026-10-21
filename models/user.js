const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Dynamically fetch current active tracking records without fetching full documents
userSchema.virtual('activeSessions', {
  ref: 'RefreshToken',
  localField: '_id',
  foreignField: 'user',
  match: () => ({ revokedAt: null, expiresAt: { $gt: new Date() } })
});

// Pre-save password hashing hook
userSchema.pre('save', async function () {
  // If the password hasn't changed, just exit the function early
  if (!this.isModified('password')) return;

  // Hash the password asynchronously
  this.password = await bcrypt.hash(this.password, 12);
  
  // No next() needed! Mongoose automatically proceeds when the async function finishes.
});

module.exports = mongoose.model('User', userSchema);
