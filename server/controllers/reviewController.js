const db = require('../config/db');

exports.getReviews = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM reviews ORDER BY rating DESC, created_at DESC LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { name, role, text, rating } = req.body;
    
    if (!name || !role || !text || !rating) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const userId = req.user.id;
    const { rows } = await db.query(
      `INSERT INTO reviews (name, role, text, rating, user_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, role, text, rating, userId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505' || err.constraint === 'unique_user_review') {
      return res.status(409).json({ error: 'You already submitted a review' });
    }
    next(err);
  }
};
