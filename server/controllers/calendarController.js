const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getEvents = async (req, res, next) => {
  try {
    const { month } = req.query; // e.g. "2024-01"
    let query = `SELECT * FROM calendar_events WHERE user_id=$1`;
    const params = [req.user.id];

    if (month) {
      query += ` AND DATE_TRUNC('month', event_date) = $2::date`;
      params.push(`${month}-01`);
    } else {
      query += ` AND event_date >= NOW() - INTERVAL '30 days'`;
    }

    query += ` ORDER BY event_date`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

exports.createEvent = async (req, res, next) => {
  try {
    const { title, event_date, event_type, workout_id, color, notes } = req.body;
    const result = await db.query(
      `INSERT INTO calendar_events (id, user_id, title, event_date, event_type, workout_id, color, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [uuidv4(), req.user.id, title, event_date, event_type || 'workout', workout_id, color || '#6366f1', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const { title, event_date, event_type, color, notes } = req.body;
    const result = await db.query(
      `UPDATE calendar_events SET title=$1, event_date=$2, event_type=$3, color=$4, notes=$5
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [title, event_date, event_type, color, notes, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    await db.query(`DELETE FROM calendar_events WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ message: 'Event deleted.' });
  } catch (err) { next(err); }
};