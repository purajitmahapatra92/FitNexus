const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// GET /api/workouts
exports.getWorkouts = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT w.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id',            we.id,
                    'exercise_id',   we.exercise_id,
                    'exercise_name', e.name,
                    'muscle_group',  e.muscle_group,
                    'equipment',     e.equipment,
                    'primary_muscle',e.primary_muscle,
                    'sets',          we.sets,
                    'reps',          we.reps,
                    'weight_kg',     we.weight_kg,
                    'rest_seconds',  we.rest_seconds,
                    'order_index',   we.order_index,
                    'is_bodyweight', CASE WHEN e.equipment = 'Bodyweight' THEN true ELSE false END
                  ) ORDER BY we.order_index
                ) FILTER (WHERE we.id IS NOT NULL),
                '[]'
              ) AS exercises
       FROM workouts w
       LEFT JOIN workout_exercises we ON we.workout_id = w.id
       LEFT JOIN exercises e          ON e.id = we.exercise_id
       WHERE w.user_id = $1
       GROUP BY w.id
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/workouts/:id
exports.getWorkout = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT w.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id',            we.id,
                    'exercise_id',   we.exercise_id,
                    'exercise_name', e.name,
                    'muscle_group',  e.muscle_group,
                    'equipment',     e.equipment,
                    'primary_muscle',e.primary_muscle,
                    'sets',          we.sets,
                    'reps',          we.reps,
                    'weight_kg',     we.weight_kg,
                    'rest_seconds',  we.rest_seconds,
                    'order_index',   we.order_index,
                    'is_bodyweight', CASE WHEN e.equipment = 'Bodyweight' THEN true ELSE false END
                  ) ORDER BY we.order_index
                ) FILTER (WHERE we.id IS NOT NULL),
                '[]'
              ) AS exercises
       FROM workouts w
       LEFT JOIN workout_exercises we ON we.workout_id = w.id
       LEFT JOIN exercises e          ON e.id = we.exercise_id
       WHERE w.id = $1 AND w.user_id = $2
       GROUP BY w.id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Workout not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// POST /api/workouts
exports.createWorkout = async (req, res, next) => {
  try {
    const { name, split_type, day_of_week, notes, exercises = [] } = req.body;
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO workouts (id, user_id, name, split_type, day_of_week, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, req.user.id, name, split_type, day_of_week, notes]
    );

    // Add exercises if provided
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await db.query(
        `INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [uuidv4(), id, ex.exercise_id, ex.sets || 3, ex.reps || 10, ex.weight_kg || 0, ex.rest_seconds || 90, i, ex.notes || null]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/workouts/:id
exports.updateWorkout = async (req, res, next) => {
  try {
    const { name, split_type, day_of_week, notes } = req.body;

    const result = await db.query(
      `UPDATE workouts SET name=$1, split_type=$2, day_of_week=$3, notes=$4, updated_at=NOW()
       WHERE id=$5 AND user_id=$6
       RETURNING *`,
      [name, split_type, day_of_week, notes, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/workouts/:id
exports.deleteWorkout = async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM workouts WHERE id=$1 AND user_id=$2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found.' });
    }
    res.json({ message: 'Workout deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/workouts/:id/start — begin a live session
exports.startSession = async (req, res, next) => {
  try {
    const sessionId = uuidv4();
    const result = await db.query(
      `INSERT INTO workout_sessions (id, user_id, workout_id, started_at, status)
       VALUES ($1, $2, $3, NOW(), 'in_progress')
       RETURNING *`,
      [sessionId, req.user.id, req.params.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/workouts/sessions/all
exports.getSessions = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const result = await db.query(
      `SELECT ws.*, w.name AS workout_name, w.split_type
       FROM workout_sessions ws
       LEFT JOIN workouts w ON w.id = ws.workout_id
       WHERE ws.user_id = $1
       ORDER BY ws.started_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/workouts/sessions/:id
exports.getSession = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT ws.*, w.name AS workout_name,
        COALESCE(json_agg(
          json_build_object(
            'id', sl.id,
            'exercise_id', sl.exercise_id,
            'exercise_name', e.name,
            'set_number', sl.set_number,
            'reps', sl.reps,
            'weight_kg', sl.weight_kg,
            'completed', sl.completed,
            'is_pr', sl.is_pr
          ) ORDER BY sl.exercise_id, sl.set_number
        ) FILTER (WHERE sl.id IS NOT NULL), '[]') AS sets
       FROM workout_sessions ws
       LEFT JOIN workouts w ON w.id = ws.workout_id
       LEFT JOIN session_logs sl ON sl.session_id = ws.id
       LEFT JOIN exercises e ON e.id = sl.exercise_id
       WHERE ws.id = $1 AND ws.user_id = $2
       GROUP BY ws.id, w.name`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/workouts/sessions/:id — log a set
exports.updateSession = async (req, res, next) => {
  try {
    const { exercise_id, set_number, reps, weight_kg } = req.body;
    const logId = uuidv4();

    // Check if it's a PR
    const prCheck = await db.query(
      `SELECT MAX(weight_kg) as max_weight FROM session_logs sl
       JOIN workout_sessions ws ON ws.id = sl.session_id
       WHERE ws.user_id = $1 AND sl.exercise_id = $2`,
      [req.user.id, exercise_id]
    );

    const isPR = !prCheck.rows[0].max_weight || weight_kg > parseFloat(prCheck.rows[0].max_weight);

    await db.query(
      `INSERT INTO session_logs (id, session_id, exercise_id, set_number, reps, weight_kg, completed, is_pr)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)
       ON CONFLICT (session_id, exercise_id, set_number)
       DO UPDATE SET reps=$5, weight_kg=$6, completed=true, is_pr=$7`,
      [logId, req.params.id, exercise_id, set_number, reps, weight_kg, isPR]
    );

    res.json({ message: 'Set logged.', is_pr: isPR });
  } catch (err) {
    next(err);
  }
};

// POST /api/workouts/sessions/:id/complete
exports.completeSession = async (req, res, next) => {
  try {
    const { duration_minutes, calories_burned, notes } = req.body;

    const { rows } = await db.query(
      `UPDATE workout_sessions
       SET status='completed', completed_at=NOW(),
           duration_minutes=$1, calories_burned=$2, notes=$3
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [duration_minutes, calories_burned, notes,
       req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const session = rows[0];

    // Get workout name for calendar event
    let workoutName = 'Workout';
    if (session.workout_id) {
      const wRes = await db.query(
        `SELECT name FROM workouts WHERE id = $1`,
        [session.workout_id]
      );
      if (wRes.rows.length) workoutName = wRes.rows[0].name;
    }

    // Auto-create calendar event
    const { v4: uuidv4 } = require('uuid');
    const today = new Date().toISOString().split('T')[0];
    await db.query(
      `INSERT INTO calendar_events
         (id, user_id, title, event_date, event_type,
          workout_id, color, notes)
       VALUES ($1, $2, $3, $4, 'workout', $5, '#6366f1', $6)
       ON CONFLICT DO NOTHING`,
      [
        uuidv4(),
        req.user.id,
        workoutName,
        today,
        session.workout_id || null,
        duration_minutes
          ? `${duration_minutes} min · ${calories_burned || 0} kcal`
          : null,
      ]
    );

    // Update streak
    await updateStreak(req.user.id);

    // Check achievements
    const { checkAndUnlock } = require('./achievementController');
    const newAchievements = await checkAndUnlock(req.user.id);

    res.json({ ...session, new_achievements: newAchievements });
  } catch (err) { next(err); }
};

// POST /api/workouts/:id/exercises
exports.addExercise = async (req, res, next) => {
  try {
    const { exercise_id, sets, reps, weight_kg, rest_seconds, notes } = req.body;

    const orderResult = await db.query(
      `SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order
       FROM workout_exercises WHERE workout_id = $1`,
      [req.params.id]
    );

    const result = await db.query(
      `INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [uuidv4(), req.params.id, exercise_id, sets || 3, reps || 10, weight_kg || 0, rest_seconds || 90, orderResult.rows[0].next_order, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/workouts/:id/exercises/:exerciseId
exports.updateExercise = async (req, res, next) => {
  try {
    const { sets, reps, weight_kg, rest_seconds, notes, order_index } = req.body;

    const result = await db.query(
      `UPDATE workout_exercises
       SET sets=$1, reps=$2, weight_kg=$3, rest_seconds=$4, notes=$5, order_index=COALESCE($6, order_index)
       WHERE id=$7
       RETURNING *`,
      [sets, reps, weight_kg, rest_seconds, notes, order_index, req.params.exerciseId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/workouts/:id/exercises/:exerciseId
exports.removeExercise = async (req, res, next) => {
  try {
    await db.query(`DELETE FROM workout_exercises WHERE id=$1`, [req.params.exerciseId]);
    res.json({ message: 'Exercise removed.' });
  } catch (err) {
    next(err);
  }
};

// Internal: update workout streak
async function updateStreak(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await db.query(
      `INSERT INTO user_streaks (user_id, last_workout_date, streak_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id) DO UPDATE
       SET streak_count = CASE
         WHEN user_streaks.last_workout_date = ($2::date - 1)
           THEN user_streaks.streak_count + 1
         WHEN user_streaks.last_workout_date = $2::date
           THEN user_streaks.streak_count
         ELSE 1
       END,
       last_workout_date = $2`,
      [userId, today]
    );
  } catch (e) {
    console.error('Streak update failed:', e.message);
  }
}

exports.swapExercise = async (req, res, next) => {
  try {
    const { old_exercise_id, new_exercise_id } = req.body;
    const sessionId = req.params.id;

    // Verify session belongs to user
    const { rows: sessionRows } = await db.query(
      `SELECT * FROM workout_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, req.user.id]
    );
    if (!sessionRows.length)
      return res.status(404).json({ error: 'Session not found.' });

    // Update any existing logs for this session to use new exercise
    await db.query(
      `UPDATE session_logs
       SET exercise_id = $1
       WHERE session_id = $2 AND exercise_id = $3`,
      [new_exercise_id, sessionId, old_exercise_id]
    );

    // Fetch the new exercise details to return
    const { rows } = await db.query(
      `SELECT e.*, e.name AS exercise_name,
              e.muscle_group, e.equipment,
              e.primary_muscle, e.movement_type
       FROM exercises e WHERE e.id = $1`,
      [new_exercise_id]
    );

    res.json(rows[0]);
  } catch (err) { next(err); }
};