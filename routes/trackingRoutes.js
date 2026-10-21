const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const protect = require('../middleware/auth');

router.use(protect); // Secure all functional metrics manipulation endpoints

router.post('/sync', trackingController.upsertMetrics);
router.patch('/add', trackingController.incrementMetrics);
router.get('/history', trackingController.getHistory);

module.exports = router;
