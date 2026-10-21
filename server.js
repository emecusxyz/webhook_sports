require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

const PORT = process.env.PORT || 5000

// Route Definitions
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/metrics', require('./routes/trackingRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes')); // 🚨 Mount the webhook router here

// Global Fallback Error Handler Interface
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Fatal Runtime Orchestration Exception' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`Cluster Online runung on port ${PORT}`)))
  .catch(err => console.error(err));
