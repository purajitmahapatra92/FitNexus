const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const db = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    // Create user
    const userResult = await db.query(
      `INSERT INTO users (id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, created_at`,
      [userId, name, email, passwordHash]
    );

    // Create empty profile
    await db.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1)`,
      [userId]
    );

    const user = userResult.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingComplete: false,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.password_hash,
              p.onboarding_complete
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboarding_complete || false,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.created_at,
              p.onboarding_complete, p.age, p.gender,
              p.height_cm, p.weight_kg, p.experience_level,
              p.fitness_goals, p.training_location
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
      onboardingComplete: user.onboarding_complete || false,
      profile: {
        age: user.age,
        gender: user.gender,
        heightCm: user.height_cm,
        weightKg: user.weight_kg,
        experienceLevel: user.experience_level,
        fitnessGoals: user.fitness_goals || [],
        trainingLocation: user.training_location,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  // JWT is stateless — client deletes the token
  res.json({ message: 'Logged out successfully.' });
};