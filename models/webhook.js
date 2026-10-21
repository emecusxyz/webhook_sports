// models/webhook.js
const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true, trim: true },
  secret: { type: String, required: true }, // Used to sign payloads so receivers can verify it's from your API
  events: [{ type: String, enum: ['metrics.milestone', 'vitals.anomaly'] }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Optimize lookup when an event fires
webhookSchema.index({ events: 1, isActive: 1 });

module.exports = mongoose.model('Webhook', webhookSchema);
