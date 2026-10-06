const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const configuredOrigin = process.env.CLIENT_URL;
    const isLocalDevelopment = process.env.NODE_ENV !== 'production'
      && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || origin === configuredOrigin || isLocalDevelopment) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || mongoose.connection.readyState === 1) return next();
  return res.status(503).json({ success: false, message: 'Database is temporarily unavailable. Please try again shortly.' });
});

app.get('/api/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({ status: databaseReady ? 'ok' : 'unavailable' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/services', require('./routes/service.routes'));
app.use('/api/workers', require('./routes/worker.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/account', require('./routes/account.routes'));

module.exports = app;
