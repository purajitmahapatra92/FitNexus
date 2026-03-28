const db = require('../config/db');

exports.getProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.created_at,
              p.*,
              p.avatar_url
       FROM users u LEFT JOIN user_profiles p ON p.user_id=u.id
       WHERE u.id=$1`,
      [req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Profile not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const {
      name, age, gender, height_cm, weight_kg, body_fat_pct,
      experience_level, injuries, available_equipment,
      training_location, days_per_week, fitness_goals,
      calories_goal, protein_goal, carbs_goal, fat_goal,
      water_goal_ml,
    } = req.body;

    // Update name in users table if provided
    if (name) {
      await db.query(
        `UPDATE users SET name=$1 WHERE id=$2`,
        [name, req.user.id]
      );
    }

    const result = await db.query(
      `UPDATE user_profiles SET
        age=$1, gender=$2, height_cm=$3, weight_kg=$4,
        body_fat_pct=$5, experience_level=$6, injuries=$7,
        available_equipment=$8, training_location=$9,
        days_per_week=$10, fitness_goals=$11,
        calories_goal=$12, protein_goal=$13,
        carbs_goal=$14, fat_goal=$15,
        water_goal_ml=COALESCE($16, water_goal_ml),
        updated_at=NOW()
       WHERE user_id=$17 RETURNING *`,
      [
        age, gender, height_cm, weight_kg, body_fat_pct,
        experience_level, injuries, available_equipment,
        training_location, days_per_week,
        JSON.stringify(fitness_goals || []),
        calories_goal, protein_goal, carbs_goal, fat_goal,
        water_goal_ml || null,
        req.user.id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

exports.completeOnboarding = async (req, res, next) => {
  try {
    const {
      age, gender, height_cm, weight_kg, body_fat_pct,
      experience_level, injuries, available_equipment,
      training_location, days_per_week, fitness_goals
    } = req.body;

    await db.query(
      `UPDATE user_profiles SET
        age=$1, gender=$2, height_cm=$3, weight_kg=$4, body_fat_pct=$5,
        experience_level=$6, injuries=$7, available_equipment=$8,
        training_location=$9, days_per_week=$10, fitness_goals=$11,
        onboarding_complete=true, updated_at=NOW()
       WHERE user_id=$12`,
      [
        age, gender, height_cm, weight_kg, body_fat_pct,
        experience_level, injuries || [],
        JSON.stringify(available_equipment || []),
        training_location, days_per_week,
        JSON.stringify(fitness_goals || []),
        req.user.id
      ]
    );

    // Seed default habits for the new user
    await seedDefaultHabits(req.user.id);

    res.json({ message: 'Onboarding complete.', onboardingComplete: true });
  } catch (err) { next(err); }
};

async function seedDefaultHabits(userId) {
  const { v4: uuidv4 } = require('uuid');
  const defaults = [
    { name: 'Drink 8 glasses of water', icon: '💧', color: '#3b82f6' },
    { name: 'Sleep 8 hours', icon: '😴', color: '#8b5cf6' },
    { name: 'Hit protein goal', icon: '🥩', color: '#ef4444' },
    { name: 'Stretch / mobility', icon: '🧘', color: '#10b981' },
    { name: '10,000 steps', icon: '👟', color: '#f59e0b' },
  ];
  for (const h of defaults) {
    await db.query(
      `INSERT INTO habits (id, user_id, name, icon, color, frequency, target_days)
       VALUES ($1,$2,$3,$4,$5,'daily',7) ON CONFLICT DO NOTHING`,
      [uuidv4(), userId, h.name, h.icon, h.color]
    );
  }
}

exports.getStreak = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT streak_count, longest_streak, last_workout_date
       FROM user_streaks WHERE user_id = $1`,
      [req.user.id]
    );
    res.json(rows[0] || { streak_count: 0, longest_streak: 0 });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const { current_password, new_password } = req.body;

    const { rows } = await db.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });

    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    if (!new_password || new_password.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    const hash = await bcrypt.hash(new_password, 12);
    await db.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [hash, req.user.id]
    );
    res.json({ message: 'Password updated successfully.' });
  } catch (err) { next(err); }
};

// POST /api/profile/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}?v=${Date.now()}`;

    await db.query(
      `UPDATE user_profiles SET avatar_url=$1 WHERE user_id=$2`,
      [avatarUrl, req.user.id]
    );

    res.json({ avatar_url: avatarUrl });
  } catch (err) { next(err); }
};

// GET /api/profile/avatar
exports.getAvatar = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT avatar_url FROM user_profiles WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ avatar_url: rows[0]?.avatar_url || null });
  } catch (err) { next(err); }
};