const crypto = require('crypto');
const Webhook = require('../models/webhook');

exports.registerWebhook = async (req, res, next) => {
  try {
    const { url, events } = req.body;
    if (!url || !events) return res.status(400).json({ message: "URL and target events array are required." });

    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await Webhook.create({
      user: req.user.id,
      url,
      events,
      secret
    });

    return res.status(201).json({
      message: "Webhook registered successfully.",
      webhookId: webhook._id,
      secret // Client must save this secret to verify signatures locally
    });
  } catch (err) { next(err); }
};
