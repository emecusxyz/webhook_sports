const SportsData = require('../models/sportsData');
const dispatchWebhookEvent = require('../utils/webhookDispatcher');

// Utility helper to isolate day boundary matching safely inside UTC bounds
const getDayRange = (dateParam) => {
  const start = new Date(dateParam);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

exports.upsertMetrics = async (req, res) => {
  try {
    const { date, metrics, vitals } = req.body;
    if (!date) return res.status(400).json({ message: "Target date string payload missing." });

    const { start } = getDayRange(date);

    // Atomic findOneAndUpdate uses native multi-tenant checks seamlessly 
    const record = await SportsData.findOneAndUpdate(
      { user: req.user.id, date: start },
      { 
        $set: { 
          metrics: metrics,
          vitals: vitals
        } 
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json(record);
  } catch (err) { console.log(err.message); }
};

// exports.incrementMetrics = async (req, res) => {
//   try {
//     const { date, steps, distanceKm, caloriesBurned, activeMinutes } = req.body;
//     const { start } = getDayRange(date || new Date());

//     const updatedRecord = await SportsData.findOneAndUpdate(
//       { user: req.user.id, date: start },
//       {
//         $inc: {
//           "metrics.steps": steps || 0,
//           "metrics.distanceKm": distanceKm || 0,
//           "metrics.caloriesBurned": caloriesBurned || 0,
//           "metrics.activeMinutes": activeMinutes || 0
//         }
//       },
//       { new: true, upsert: true }
//     );

//     return res.status(200).json(updatedRecord);
//   } catch (err) { console.log(err.message); }
// };


exports.incrementMetrics = async (req, res, next) => {
  try {
    const { date, steps, distanceKm, caloriesBurned, activeMinutes } = req.body;
    const start = new Date(date || new Date());
    start.setUTCHours(0,0,0,0);

    const updatedRecord = await SportsData.findOneAndUpdate(
      { user: req.user.id, date: start },
      {
        $inc: {
          "metrics.steps": steps || 0,
          "metrics.distanceKm": distanceKm || 0,
          "metrics.caloriesBurned": caloriesBurned || 0,
          "metrics.activeMinutes": activeMinutes || 0
        }
      },
      { new: true, upsert: true }
    );

    // 🚨 TRIGGER WEBHOOK: If the user crosses the 10,000 daily step milestone
    if (updatedRecord.metrics.steps >= 10000 && (updatedRecord.metrics.steps - (steps || 0)) < 10000) {
      await dispatchWebhookEvent(req.user.id, 'metrics.milestone', {
        message: "Congratulations! Daily 10k steps milestone unlocked.",
        currentSteps: updatedRecord.metrics.steps,
        date: updatedRecord.date
      });
    }

    return res.status(200).json(updatedRecord);
  } catch (err) { next(err); }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await SportsData.find({ user: req.user.id }).sort({ date: -1 }).limit(30);
    return res.status(200).json(history);
  } catch (err) { console.log(err.message); }
};
