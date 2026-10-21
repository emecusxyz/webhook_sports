// // controllers/webhookController.js
// const crypto = require('crypto');
// const Webhook = require('../models/webhook');

// exports.registerWebhook = async (req, res, next) => {
//   try {
//     const { url, events } = req.body;
//     if (!url || !events) return res.status(400).json({ message: "URL and target events are required." });

//     // Generate a unique signing key for the user to store safely
//     const secret = crypto.randomBytes(32).toString('hex');

//     const webhook = await Webhook.create({
//       user: req.user.id,
//       url,
//       events,
//       secret
//     });

//     // Provide the secret ONLY once during creation
//     return res.status(201).json({
//       message: "Webhook registered successfully.",
//       webhookId: webhook._id,
//       secret
//     });
//   } catch (err) { next(err); }
// };


const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const protect = require('../middleware/auth');

router.post('/register', protect, webhookController.registerWebhook);

module.exports = router;
