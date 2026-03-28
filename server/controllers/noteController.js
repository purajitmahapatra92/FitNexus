// noteController.js
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getNotes = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM notes WHERE user_id=$1 ORDER BY is_pinned DESC, updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

exports.createNote = async (req, res, next) => {
  try {
    const { title, content, color, position_x, position_y } = req.body;
    const result = await db.query(
      `INSERT INTO notes (id, user_id, title, content, color, position_x, position_y)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [uuidv4(), req.user.id, title || 'New Note', content || '', color || '#fef08a', position_x || 0, position_y || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

exports.updateNote = async (req, res, next) => {
  try {
    const { title, content, color, position_x, position_y } = req.body;
    const result = await db.query(
      `UPDATE notes SET title=$1, content=$2, color=$3, position_x=$4, position_y=$5, updated_at=NOW()
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [title, content, color, position_x, position_y, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

exports.deleteNote = async (req, res, next) => {
  try {
    await db.query(`DELETE FROM notes WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ message: 'Note deleted.' });
  } catch (err) { next(err); }
};

exports.togglePin = async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE notes SET is_pinned = NOT is_pinned WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

module.exports = exports;