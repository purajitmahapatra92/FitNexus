const db = require('../config/db');

// Helper — convert array of objects to CSV string
function toCSV(rows, columns) {
  if (!rows.length) return columns.join(',') + '\n';
  const header = columns.join(',');
  const lines  = rows.map(row =>
    columns.map(col => {
      const val = row[col] ?? '';
      const str = String(val).replace(/"/g, '""');
      return /[,"\n]/.test(str) ? `"${str}"` : str;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// GET /api/export/workouts
exports.exportWorkouts = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT
         ws.id                AS session_id,
         w.name               AS workout_name,
         w.split_type,
         ws.status,
         ws.started_at,
         ws.completed_at,
         ws.duration_minutes,
         ws.calories_burned,
         ws.notes,
         e.name               AS exercise_name,
         e.muscle_group,
         sl.set_number,
         sl.reps,
         sl.weight_kg,
         sl.is_pr
       FROM workout_sessions ws
       JOIN workouts          w  ON w.id  = ws.workout_id
       LEFT JOIN session_logs sl ON sl.session_id = ws.id
       LEFT JOIN exercises    e  ON e.id  = sl.exercise_id
       WHERE ws.user_id = $1
         AND ws.status  = 'completed'
       ORDER BY ws.started_at DESC, sl.set_number ASC`,
      [req.user.id]
    );

    const csv = toCSV(rows, [
      'session_id','workout_name','split_type','status',
      'started_at','completed_at','duration_minutes',
      'calories_burned','notes','exercise_name',
      'muscle_group','set_number','reps','weight_kg','is_pr',
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fitnexus_workouts_${today()}.csv"`
    );
    res.send(csv);
  } catch (err) { next(err); }
};

// GET /api/export/nutrition
exports.exportNutrition = async (req, res, next) => {
  try {
    // First check what columns actually exist in nutrition_logs
    const colCheck = await db.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'nutrition_logs'
       ORDER BY ordinal_position`
    );
    const cols = colCheck.rows.map(r => r.column_name);

    // Use created_at if logged_at doesn't exist
    const timeCol = cols.includes('logged_at')
      ? 'logged_at'
      : cols.includes('created_at')
        ? 'created_at'
        : null;

    const selectTime = timeCol ? `, ${timeCol} AS logged_at` : '';

    const { rows } = await db.query(
      `SELECT
         log_date,
         meal_type,
         food_name,
         serving_size,
         serving_unit,
         calories,
         protein_g,
         carbs_g,
         fat_g,
         fiber_g
         ${selectTime}
       FROM nutrition_logs
       WHERE user_id = $1
       ORDER BY log_date DESC`,
      [req.user.id]
    );

    const exportCols = [
      'log_date','meal_type','food_name','serving_size',
      'serving_unit','calories','protein_g','carbs_g','fat_g','fiber_g',
    ];
    if (timeCol) exportCols.push('logged_at');

    const csv = toCSV(rows, exportCols);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fitnexus_nutrition_${today()}.csv"`
    );
    res.send(csv);
  } catch (err) { next(err); }
};

// GET /api/export/progress
exports.exportProgress = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT
         metric_type,
         value,
         unit,
         notes,
         recorded_at
       FROM progress_metrics
       WHERE user_id = $1
       ORDER BY recorded_at DESC`,
      [req.user.id]
    );

    const csv = toCSV(rows, [
      'metric_type','value','unit','notes','recorded_at',
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fitnexus_progress_${today()}.csv"`
    );
    res.send(csv);
  } catch (err) { next(err); }
};

// GET /api/export/prs
exports.exportPRs = async (req, res, next) => {
  try {
    // Check which PRs table exists
    const tableCheck = await db.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('user_prs', 'personal_records', 'prs')`
    );

    if (!tableCheck.rows.length) {
      // No PRs table — derive PRs from session_logs instead
      const { rows } = await db.query(
        `SELECT
           e.name        AS exercise_name,
           e.muscle_group,
           sl.weight_kg,
           sl.reps,
           ws.completed_at AS achieved_at
         FROM session_logs sl
         JOIN exercises     e  ON e.id  = sl.exercise_id
         JOIN workout_sessions ws ON ws.id = sl.session_id
         WHERE ws.user_id = $1
           AND sl.is_pr   = true
           AND ws.status  = 'completed'
         ORDER BY ws.completed_at DESC`,
        [req.user.id]
      );

      const csv = toCSV(rows, [
        'exercise_name','muscle_group',
        'weight_kg','reps','achieved_at',
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="fitnexus_prs_${today()}.csv"`
      );
      return res.send(csv);
    }

    // PRs table exists — use it
    const tableName  = tableCheck.rows[0].table_name;
    const { rows } = await db.query(
      `SELECT
         e.name        AS exercise_name,
         e.muscle_group,
         pr.weight_kg,
         pr.reps,
         pr.achieved_at
       FROM ${tableName} pr
       JOIN exercises e ON e.id = pr.exercise_id
       WHERE pr.user_id = $1
       ORDER BY pr.achieved_at DESC`,
      [req.user.id]
    );

    const csv = toCSV(rows, [
      'exercise_name','muscle_group',
      'weight_kg','reps','achieved_at',
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fitnexus_prs_${today()}.csv"`
    );
    res.send(csv);
  } catch (err) { next(err); }
};