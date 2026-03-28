const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// GET /api/habits
exports.getHabits = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query(
      `SELECT h.*,
        COALESCE(
          (SELECT completed FROM habit_logs
           WHERE habit_id=h.id AND log_date=$2 LIMIT 1), false
        ) AS completed_today,
        COALESCE(
          (SELECT COUNT(*) FROM habit_logs
           WHERE habit_id=h.id AND completed=true
           AND log_date >= NOW() - INTERVAL '7 days'), 0
        ) AS completions_this_week
       FROM habits h
       WHERE h.user_id=$1 AND h.is_active=true
       ORDER BY h.created_at`,
      [req.user.id, today]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/habits
exports.createHabit = async (req, res, next) => {
  try {
    const { name, description, icon, color, target_days, frequency } = req.body;
    const result = await db.query(
      `INSERT INTO habits (id, user_id, name, description, icon, color, target_days, frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [uuidv4(), req.user.id, name, description, icon || '🎯', color || '#6366f1', target_days || 7, frequency || 'daily']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/habits/:id
exports.updateHabit = async (req, res, next) => {
  try {
    const { name, description, icon, color, target_days, frequency } = req.body;
    const result = await db.query(
      `UPDATE habits SET name=$1, description=$2, icon=$3, color=$4,
        target_days=$5, frequency=$6, updated_at=NOW()
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name, description, icon, color, target_days, frequency, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Habit not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/habits/:id
exports.deleteHabit = async (req, res, next) => {
  try {
    await db.query(
      `UPDATE habits SET is_active=false WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Habit deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/habits/:id/complete
exports.toggleComplete = async (req, res, next) => {
  try {
    const { date } = req.body;
    const logDate = date || new Date().toISOString().split('T')[0];

    const existing = await db.query(
      `SELECT id, completed FROM habit_logs WHERE habit_id=$1 AND log_date=$2`,
      [req.params.id, logDate]
    );

    let completed;
    if (existing.rows.length > 0) {
      const toggled = !existing.rows[0].completed;
      await db.query(
        `UPDATE habit_logs SET completed=$1 WHERE id=$2`,
        [toggled, existing.rows[0].id]
      );
      completed = toggled;
    } else {
      await db.query(
        `INSERT INTO habit_logs (id, habit_id, user_id, log_date, completed)
         VALUES ($1, $2, $3, $4, true)`,
        [uuidv4(), req.params.id, req.user.id, logDate]
      );
      completed = true;
    }

    res.json({ completed, date: logDate });
  } catch (err) {
    next(err);
  }
};

// GET /api/habits/:id/streak
exports.getStreak = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT log_date FROM habit_logs
       WHERE habit_id=$1 AND completed=true
       ORDER BY log_date DESC`,
      [req.params.id]
    );

    const dates = result.rows.map(r => r.log_date.toISOString().split('T')[0]);
    let streak = 0;
    let current = new Date();

    for (const dateStr of dates) {
      const expected = current.toISOString().split('T')[0];
      if (dateStr === expected) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({ streak, total_completions: dates.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/habits/summary/today
exports.getTodaySummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query(
      `SELECT
        COUNT(h.id) AS total_habits,
        COUNT(hl.id) FILTER (WHERE hl.completed=true) AS completed_today
       FROM habits h
       LEFT JOIN habit_logs hl ON hl.habit_id=h.id AND hl.log_date=$2
       WHERE h.user_id=$1 AND h.is_active=true`,
      [req.user.id, today]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/habits/summary/week
exports.getWeekSummary = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT h.id, h.name, h.icon, h.color,
        COALESCE(json_agg(
          json_build_object('date', hl.log_date, 'completed', hl.completed)
          ORDER BY hl.log_date
        ) FILTER (WHERE hl.id IS NOT NULL), '[]') AS week_logs
       FROM habits h
       LEFT JOIN habit_logs hl ON hl.habit_id=h.id
         AND hl.log_date >= NOW() - INTERVAL '6 days'
       WHERE h.user_id=$1 AND h.is_active=true
       GROUP BY h.id ORDER BY h.created_at`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/habits/water/today
exports.getWaterToday = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
       FROM water_logs
       WHERE user_id = $1 AND log_date = $2`,
      [req.user.id, today]
    );
    const goal = await db.query(
      `SELECT water_goal_ml FROM user_profiles WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({
      total_ml: Number(rows[0].total_ml),
      goal_ml:  Number(goal.rows[0]?.water_goal_ml) || 2500,
    });
  } catch (err) { next(err); }
};

// POST /api/habits/water/add
exports.addWater = async (req, res, next) => {
  try {
    const { amount_ml } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const { v4: uuidv4 } = require('uuid');
    await db.query(
      `INSERT INTO water_logs (id, user_id, amount_ml, log_date)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), req.user.id, amount_ml, today]
    );
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
       FROM water_logs
       WHERE user_id = $1 AND log_date = $2`,
      [req.user.id, today]
    );
    const goal = await db.query(
      `SELECT water_goal_ml FROM user_profiles WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({
      total_ml: Number(rows[0].total_ml),
      goal_ml:  Number(goal.rows[0]?.water_goal_ml) || 2500,
    });
  } catch (err) { next(err); }
};

// DELETE /api/habits/water/reset
exports.resetWater = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await db.query(
      `DELETE FROM water_logs WHERE user_id = $1 AND log_date = $2`,
      [req.user.id, today]
    );
    res.json({ total_ml: 0 });
  } catch (err) { next(err); }
};