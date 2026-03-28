const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: '../.env' });

const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const exerciseRoutes = require('./routes/exercises');
const nutritionRoutes = require('./routes/nutrition');
const habitRoutes = require('./routes/habits');
const progressRoutes = require('./routes/progress');
const noteRoutes = require('./routes/notes');
const achievementRoutes = require('./routes/achievements');
const calendarRoutes = require('./routes/calendar');
const profileRoutes = require('./routes/profile');
const exportRoutes = require('./routes/export');
const reviewsRoutes = require('./routes/reviews');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Logging ────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static files — serve uploaded avatars ─────────────────────
// Serve uploaded avatars — must come before API routes
app.use('/uploads', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('Cache-Control', 'no-cache');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/reviews', reviewsRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FitNexus server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;