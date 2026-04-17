const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const KEEP_ALIVE_INTERVAL_MS = 20 * 60 * 1000;

const startKeepAliveCron = () => {
  const enabled = process.env.ENABLE_KEEP_ALIVE === 'true' || process.env.NODE_ENV === 'production';
  if (!enabled) return;

  const targetUrl =
    process.env.KEEP_ALIVE_URL ||
    process.env.PUBLIC_URL ||
    process.env.BACKEND_URL ||
    `http://localhost:${PORT}`;

  const ping = async () => {
    try {
      const response = await axios.get(`${targetUrl.replace(/\/$/, '')}/api/health`, {
        timeout: 10000,
      });
      console.log(`[keep-alive] pinged ${targetUrl}/api/health -> ${response.status}`);
    } catch (error) {
      const status = error.response?.status;
      const message = error.message || 'Unknown error';
      console.error(`[keep-alive] ping failed (${status || 'no-status'}): ${message}`);
    }
  };

  setInterval(ping, KEEP_ALIVE_INTERVAL_MS);
  ping();
};

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://0.0.0.0:3000',
  'https://pockettrack.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser / same-origin requests with no Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for Passport
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pockettrack')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/categorization', require('./routes/categorization'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PocketTrack Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startKeepAliveCron();
});

module.exports = app;
