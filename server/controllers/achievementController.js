const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.getAchievements = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT ad.*,
        ua.earned_at,
        ua.xp_awarded,
        CASE WHEN ua.user_id IS NOT NULL THEN true ELSE false END AS earned
       FROM achievement_definitions ad
       LEFT JOIN user_achievements ua
         ON ua.achievement_id = ad.id AND ua.user_id = $1
       ORDER BY ad.category, ad.xp_value`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getRecent = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT ad.*, ua.earned_at
       FROM user_achievements ua
       JOIN achievement_definitions ad ON ad.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC LIMIT 5`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getXPSummary = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT
        COALESCE(SUM(xp_awarded), 0)  AS total_xp,
        COUNT(*)                       AS achievements_earned
       FROM user_achievements WHERE user_id = $1`,
      [req.user.id]
    );
    const totalXP            = Number(rows[0].total_xp);
    const achievementsEarned = Number(rows[0].achievements_earned);
    const level              = Math.floor(Math.sqrt(totalXP / 100)) + 1;
    const xpForCurrent       = Math.pow(level - 1, 2) * 100;
    const xpForNext          = Math.pow(level, 2) * 100;

    res.json({
      total_xp:            totalXP,
      achievements_earned: achievementsEarned,
      level,
      xp_progress:         totalXP - xpForCurrent,
      xp_needed:           xpForNext - xpForCurrent,
    });
  } catch (err) { next(err); }
};

// ── Internal: called after session complete, habit log, nutrition log ──
async function checkAndUnlock(userId) {
  try {
    // Get all unlocked achievement keys for this user
    const unlocked = await db.query(
      `SELECT ad.key FROM user_achievements ua
       JOIN achievement_definitions ad ON ad.id = ua.achievement_id
       WHERE ua.user_id = $1`,
      [userId]
    );
    const unlockedKeys = new Set(unlocked.rows.map(r => r.key));

    const toUnlock = [];

    // ── Workout counts ──
    const wcRes = await db.query(
      `SELECT COUNT(*) AS cnt FROM workout_sessions
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    const workoutCount = Number(wcRes.rows[0].cnt);

    if (workoutCount >= 1   && !unlockedKeys.has('first_workout'))  toUnlock.push('first_workout');
    if (workoutCount >= 10  && !unlockedKeys.has('workouts_10'))    toUnlock.push('workouts_10');
    if (workoutCount >= 50  && !unlockedKeys.has('workouts_50'))    toUnlock.push('workouts_50');
    if (workoutCount >= 100 && !unlockedKeys.has('workouts_100'))   toUnlock.push('workouts_100');

    // ── Streaks ──
    const strRes = await db.query(
      `SELECT streak_count FROM user_streaks WHERE user_id = $1`,
      [userId]
    );
    const streak = Number(strRes.rows[0]?.streak_count || 0);

    if (streak >= 7   && !unlockedKeys.has('streak_7'))   toUnlock.push('streak_7');
    if (streak >= 30  && !unlockedKeys.has('streak_30'))  toUnlock.push('streak_30');
    if (streak >= 100 && !unlockedKeys.has('streak_100')) toUnlock.push('streak_100');

    // ── PRs ──
    const prRes = await db.query(
      `SELECT COUNT(DISTINCT exercise_id) AS cnt
       FROM session_logs sl
       JOIN workout_sessions ws ON ws.id = sl.session_id
       WHERE ws.user_id = $1 AND sl.is_pr = true`,
      [userId]
    );
    const prCount = Number(prRes.rows[0].cnt);

    if (prCount >= 1 && !unlockedKeys.has('new_pr')) toUnlock.push('new_pr');
    if (prCount >= 5 && !unlockedKeys.has('pr_5'))   toUnlock.push('pr_5');

    // ── Nutrition streak ──
    const nutRes = await db.query(
      `SELECT COUNT(DISTINCT log_date) AS cnt
       FROM nutrition_logs
       WHERE user_id = $1
         AND log_date >= NOW() - INTERVAL '7 days'`,
      [userId]
    );
    const nutDays = Number(nutRes.rows[0].cnt);
    if (nutDays >= 7 && !unlockedKeys.has('log_food_7')) toUnlock.push('log_food_7');

    // ── Notes ──
    const noteRes = await db.query(
      `SELECT COUNT(*) AS cnt FROM notes WHERE user_id = $1`,
      [userId]
    );
    if (Number(noteRes.rows[0].cnt) >= 10 && !unlockedKeys.has('notes_10'))
      toUnlock.push('notes_10');

    // ── Weight logged ──
    const weightRes = await db.query(
      `SELECT COUNT(*) AS cnt FROM progress_metrics
       WHERE user_id = $1 AND metric_type = 'weight'`,
      [userId]
    );
    if (Number(weightRes.rows[0].cnt) >= 10 && !unlockedKeys.has('weight_logged_10'))
      toUnlock.push('weight_logged_10');

    // ── Insert unlocked achievements ──
    for (const key of toUnlock) {
      const defRes = await db.query(
        `SELECT id, xp_value FROM achievement_definitions WHERE key = $1`,
        [key]
      );
      if (!defRes.rows.length) continue;
      const { id: achId, xp_value } = defRes.rows[0];
      await db.query(
        `INSERT INTO user_achievements
           (id, user_id, achievement_id, earned_at, xp_awarded)
         VALUES ($1, $2, $3, NOW(), $4)
         ON CONFLICT (user_id, achievement_id) DO NOTHING`,
        [uuidv4(), userId, achId, xp_value]
      );
    }

    return toUnlock;
  } catch (e) {
    console.error('Achievement check failed:', e.message);
    return [];
  }
}

exports.checkAndUnlock = checkAndUnlock;