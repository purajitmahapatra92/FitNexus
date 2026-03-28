const db = require('../config/db');

exports.getExercises = async (req, res, next) => {
  try {
    const { muscle, equipment, difficulty, search } = req.query;
    let sql    = `SELECT * FROM exercises WHERE 1=1`;
    const params = [];
    let i = 1;
    if (muscle)     { sql += ` AND muscle_group=$${i++}`;  params.push(muscle);     }
    if (equipment)  { sql += ` AND equipment=$${i++}`;     params.push(equipment);  }
    if (difficulty) { sql += ` AND difficulty=$${i++}`;    params.push(difficulty); }
    if (search)     { sql += ` AND name ILIKE $${i++}`;    params.push(`%${search}%`); }
    sql += ` ORDER BY muscle_group, name`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getExercise = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM exercises WHERE id=$1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Exercise not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.getByMuscle = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM exercises WHERE muscle_group=$1 ORDER BY name`,
      [req.params.group]
    );
    res.json(rows);
  } catch (err) { next(err); }
};