const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// GET /api/progress/metrics
exports.getMetrics = async (req, res, next) => {
  try {
    const { type, limit = 30 } = req.query;
    let query = `SELECT * FROM progress_metrics WHERE user_id=$1`;
    const params = [req.user.id];
    if (type) { query += ` AND metric_type=$2`; params.push(type); }
    query += ` ORDER BY recorded_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/progress/metrics
exports.addMetric = async (req, res, next) => {
  try {
    const { metric_type, value, unit, notes, recorded_at } = req.body;
    const result = await db.query(
      `INSERT INTO progress_metrics (id, user_id, metric_type, value, unit, notes, recorded_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [uuidv4(), req.user.id, metric_type, value, unit, notes, recorded_at || new Date()]
    );
    // Update user_profiles weight if metric_type is weight
    if (metric_type === 'weight') {
      await db.query(`UPDATE user_profiles SET weight_kg=$1 WHERE user_id=$2`, [value, req.user.id]);
    }
    res.status(201).json(rows[0]);
    const { checkAndUnlock } = require('./achievementController');
    checkAndUnlock(req.user.id).catch(() => {});
  } catch (err) { next(err); }
};

// DELETE /api/progress/metrics/:id
exports.deleteMetric = async (req, res, next) => {
  try {
    await db.query(`DELETE FROM progress_metrics WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ message: 'Metric deleted.' });
  } catch (err) { next(err); }
};

// GET /api/progress/prs
exports.getPRs = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT ON (sl.exercise_id)
        sl.exercise_id, e.name AS exercise_name, e.muscle_group,
        sl.weight_kg, sl.reps, ws.started_at AS achieved_at
       FROM session_logs sl
       JOIN workout_sessions ws ON ws.id=sl.session_id
       JOIN exercises e ON e.id=sl.exercise_id
       WHERE ws.user_id=$1 AND sl.is_pr=true
       ORDER BY sl.exercise_id, sl.weight_kg DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/progress/prs/:exerciseId
exports.getExercisePRs = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT sl.weight_kg, sl.reps, ws.started_at AS achieved_at
       FROM session_logs sl
       JOIN workout_sessions ws ON ws.id=sl.session_id
       WHERE ws.user_id=$1 AND sl.exercise_id=$2
       ORDER BY ws.started_at`,
      [req.user.id, req.params.exerciseId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/progress/volume
exports.getVolumeHistory = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT DATE(ws.started_at) AS date,
        SUM(sl.weight_kg * sl.reps) AS total_volume,
        COUNT(DISTINCT sl.exercise_id) AS exercises_count
       FROM session_logs sl
       JOIN workout_sessions ws ON ws.id=sl.session_id
       WHERE ws.user_id=$1 AND ws.started_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(ws.started_at)
       ORDER BY date`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/progress/photos
exports.getPhotos = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, photo_date, note, created_at FROM progress_photos
       WHERE user_id=$1 ORDER BY photo_date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/progress/photos
exports.addPhoto = async (req, res, next) => {
  try {
    const { photo_data, photo_date, note } = req.body;
    const result = await db.query(
      `INSERT INTO progress_photos (id, user_id, photo_data, photo_date, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, photo_date, note, created_at`,
      [uuidv4(), req.user.id, photo_data, photo_date || new Date(), note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/progress/photos/:id
exports.deletePhoto = async (req, res, next) => {
  try {
    await db.query(`DELETE FROM progress_photos WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ message: 'Photo deleted.' });
  } catch (err) { next(err); }
};