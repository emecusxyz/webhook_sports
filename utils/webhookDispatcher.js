// utils/webhookDispatcher.js
const crypto = require('crypto');
const Webhook = require('../models/webhook');

/**
 * Dispatches a sports event to all interested subscribers asynchronously
 */
async function dispatchWebhookEvent(userId, eventName, payload) {
  // Fire and forget: process in background so the user API response stays fast
  setImmediate(async () => {
    try {
      const subscriptions = await Webhook.find({
        user: userId,
        events: eventName,
        isActive: true
      });

      for (const sub of subscriptions) {
        const timestamp = Date.now();
        const bodyStr = JSON.stringify({ event: eventName, timestamp, data: payload });
        
        // Create an HMAC signature so the client can verify the webhook came from your server
        const signature = crypto
          .createHmac('sha256', sub.secret)
          .update(`${timestamp}.${bodyStr}`)
          .digest('hex');

        // Send payload natively or via fetch
        fetch(sub.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SportsApp-Signature': signature,
            'X-SportsApp-Timestamp': timestamp.toString()
          },
          body: bodyStr
        }).catch(err => console.error(`Webhook delivery failed to ${sub.url}:`, err.message));
      }
    } catch (err) {
      console.error('Webhook dispatch subsystem error:', err);
    }
  });
}

module.exports = dispatchWebhookEvent;
