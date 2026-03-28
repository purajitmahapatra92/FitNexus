-- ============================================================
-- FitNexus Database Schema
-- Run: psql -U postgres -d fitnexus -f schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USER PROFILES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age                  INT,
  gender               VARCHAR(20),
  height_cm            NUMERIC(5,1),
  weight_kg            NUMERIC(5,2),
  body_fat_pct         NUMERIC(4,1),
  experience_level     VARCHAR(20) DEFAULT 'beginner',
  injuries             TEXT[],
  available_equipment  JSONB DEFAULT '[]',
  training_location    VARCHAR(20) DEFAULT 'gym',
  days_per_week        INT DEFAULT 3,
  fitness_goals        JSONB DEFAULT '[]',
  calories_goal        INT DEFAULT 2000,
  protein_goal         INT DEFAULT 150,
  carbs_goal           INT DEFAULT 200,
  fat_goal             INT DEFAULT 70,
  onboarding_complete  BOOLEAN DEFAULT false,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EXERCISES (Global Database) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercises (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(150) NOT NULL,
  muscle_group VARCHAR(50) NOT NULL,
  secondary_muscles TEXT[],
  equipment    VARCHAR(50) NOT NULL,
  difficulty   VARCHAR(20) NOT NULL,
  instructions TEXT,
  tips         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WORKOUTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workouts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(150) NOT NULL,
  split_type   VARCHAR(50),
  day_of_week  INT, -- 0=Sun, 1=Mon ... 6=Sat
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WORKOUT EXERCISES (exercises within a workout plan) ─────────────────────
CREATE TABLE IF NOT EXISTS workout_exercises (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id   UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id  UUID NOT NULL REFERENCES exercises(id),
  sets         INT NOT NULL DEFAULT 3,
  reps         INT NOT NULL DEFAULT 10,
  weight_kg    NUMERIC(6,2) DEFAULT 0,
  rest_seconds INT DEFAULT 90,
  order_index  INT DEFAULT 0,
  notes        TEXT
);

-- ─── WORKOUT SESSIONS (live/completed workout tracking) ──────────────────────
CREATE TABLE IF NOT EXISTS workout_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id       UUID REFERENCES workouts(id) ON DELETE SET NULL,
  status           VARCHAR(20) DEFAULT 'in_progress',
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  duration_minutes INT,
  calories_burned  INT,
  notes            TEXT
);

-- ─── SESSION LOGS (individual sets logged during a session) ──────────────────
CREATE TABLE IF NOT EXISTS session_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  set_number  INT NOT NULL,
  reps        INT NOT NULL,
  weight_kg   NUMERIC(6,2) NOT NULL DEFAULT 0,
  completed   BOOLEAN DEFAULT false,
  is_pr       BOOLEAN DEFAULT false,
  logged_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, exercise_id, set_number)
);

-- ─── NUTRITION LOGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name    VARCHAR(200) NOT NULL,
  brand        VARCHAR(100),
  meal_type    VARCHAR(20) NOT NULL DEFAULT 'snack',
  serving_size NUMERIC(7,2) DEFAULT 1,
  serving_unit VARCHAR(30) DEFAULT 'serving',
  calories     NUMERIC(7,2) NOT NULL DEFAULT 0,
  protein_g    NUMERIC(6,2) DEFAULT 0,
  carbs_g      NUMERIC(6,2) DEFAULT 0,
  fat_g        NUMERIC(6,2) DEFAULT 0,
  fiber_g      NUMERIC(6,2) DEFAULT 0,
  log_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HABITS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  icon        VARCHAR(10) DEFAULT '🎯',
  color       VARCHAR(20) DEFAULT '#6366f1',
  frequency   VARCHAR(20) DEFAULT 'daily',
  target_days INT DEFAULT 7,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HABIT LOGS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id   UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  completed  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

-- ─── PROGRESS METRICS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_metrics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- weight, body_fat, chest, waist, hips, arms, legs
  value       NUMERIC(7,2) NOT NULL,
  unit        VARCHAR(20) DEFAULT 'kg',
  notes       TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROGRESS PHOTOS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_data  TEXT NOT NULL, -- base64 encoded
  photo_date  DATE DEFAULT CURRENT_DATE,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) DEFAULT 'New Note',
  content     TEXT DEFAULT '',
  color       VARCHAR(20) DEFAULT '#fef08a',
  position_x  INT DEFAULT 0,
  position_y  INT DEFAULT 0,
  is_pinned   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CALENDAR EVENTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  event_date  DATE NOT NULL,
  event_type  VARCHAR(30) DEFAULT 'workout', -- workout, rest, habit, custom
  workout_id  UUID REFERENCES workouts(id) ON DELETE SET NULL,
  color       VARCHAR(20) DEFAULT '#6366f1',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ACHIEVEMENT DEFINITIONS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  icon        VARCHAR(10),
  category    VARCHAR(50),
  xp_value    INT DEFAULT 100
);

-- ─── USER ACHIEVEMENTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id),
  earned_at      TIMESTAMPTZ DEFAULT NOW(),
  xp_awarded     INT DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- ─── USER STREAKS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  streak_count      INT DEFAULT 0,
  longest_streak    INT DEFAULT 0,
  last_workout_date DATE,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workouts_user          ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user          ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started       ON workout_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_session_logs_session   ON session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_exercise  ON session_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_user_date    ON nutrition_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_habits_user            ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date  ON habit_logs(habit_id, log_date);
CREATE INDEX IF NOT EXISTS idx_progress_user_type     ON progress_metrics(user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_notes_user             ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user_date     ON calendar_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle       ON exercises(muscle_group);

-- ─── SEED: ACHIEVEMENT DEFINITIONS ───────────────────────────────────────────
INSERT INTO achievement_definitions (key, name, description, icon, category, xp_value) VALUES
  ('first_workout',      'First Step',          'Complete your first workout',            '🏆', 'workout',   100),
  ('streak_7',           '7 Day Streak',        'Work out 7 days in a row',               '🔥', 'streak',    250),
  ('streak_30',          '30 Day Streak',       'Work out 30 days in a row',              '💫', 'streak',   1000),
  ('streak_100',         '100 Day Streak',      'Work out 100 days in a row',             '👑', 'streak',   5000),
  ('workouts_10',        'Getting Started',     'Complete 10 workouts',                   '💪', 'workout',   200),
  ('workouts_50',        'Dedicated',           'Complete 50 workouts',                   '🎯', 'workout',   500),
  ('workouts_100',       'Century Club',        'Complete 100 workouts',                  '🏅', 'workout',  1000),
  ('new_pr',             'New PR!',             'Set a new personal record',              '⚡', 'strength',  150),
  ('pr_5',               'Strength Seeker',     'Set 5 personal records',                 '🦾', 'strength',  400),
  ('log_food_7',         'Nutrition Aware',     'Log food for 7 consecutive days',        '🥗', 'nutrition', 200),
  ('hit_protein_7',      'Protein King',        'Hit protein goal 7 days in a row',       '🥩', 'nutrition', 300),
  ('habit_streak_7',     'Habit Builder',       'Complete all habits for 7 days',         '✅', 'habit',     250),
  ('habit_streak_30',    'Habit Master',        'Complete all habits for 30 days',        '🧠', 'habit',    1000),
  ('notes_10',           'Journaler',           'Create 10 sticky notes',                 '📝', 'general',   100),
  ('weight_logged_10',   'Progress Tracker',    'Log your weight 10 times',               '📊', 'progress',  200)
ON CONFLICT (key) DO NOTHING;

-- ─── SEED: EXERCISES DATABASE ─────────────────────────────────────────────────
INSERT INTO exercises (name, muscle_group, secondary_muscles, equipment, difficulty, instructions) VALUES
-- CHEST
('Barbell Bench Press',     'Chest', ARRAY['Triceps','Front Delts'], 'Barbell',    'intermediate', 'Lie flat on bench. Lower bar to chest. Press up explosively.'),
('Incline Bench Press',     'Chest', ARRAY['Triceps','Front Delts'], 'Barbell',    'intermediate', 'Set bench to 30-45°. Lower bar to upper chest. Press up.'),
('Dumbbell Flyes',          'Chest', ARRAY['Front Delts'],           'Dumbbells',  'beginner',     'Lie flat. With slight elbow bend, open arms wide. Squeeze chest to bring back.'),
('Push-Ups',                'Chest', ARRAY['Triceps','Core'],        'Bodyweight', 'beginner',     'Place hands shoulder-width. Lower chest to floor. Push back up.'),
('Cable Crossover',         'Chest', ARRAY['Front Delts'],           'Cable',      'intermediate', 'Set cables high. Step forward and cross hands at chest height.'),
('Dip (Chest)',             'Chest', ARRAY['Triceps'],               'Bodyweight', 'intermediate', 'Lean forward slightly. Lower body between bars. Push back up.'),
('Pec Deck Machine',        'Chest', ARRAY[],                        'Machine',    'beginner',     'Sit upright. Bring pads together in front of chest.'),
('Dumbbell Bench Press',    'Chest', ARRAY['Triceps','Front Delts'], 'Dumbbells',  'beginner',     'Lie flat with dumbbells. Lower to chest level. Press up and slightly inward.'),
-- BACK
('Pull-Up',                 'Back',  ARRAY['Biceps'],                'Bodyweight', 'intermediate', 'Grip bar overhand. Pull chest to bar. Lower with control.'),
('Barbell Row',             'Back',  ARRAY['Biceps','Rear Delts'],   'Barbell',    'intermediate', 'Hinge at hips. Pull bar to lower chest. Squeeze lats.'),
('Lat Pulldown',            'Back',  ARRAY['Biceps'],                'Cable',      'beginner',     'Grip bar wide. Pull to upper chest. Control the return.'),
('Seated Cable Row',        'Back',  ARRAY['Biceps','Rear Delts'],   'Cable',      'beginner',     'Sit tall. Pull handle to stomach. Squeeze shoulder blades.'),
('Deadlift',                'Back',  ARRAY['Glutes','Hamstrings'],   'Barbell',    'advanced',     'Stand with bar over midfoot. Hinge, grip, and drive hips to stand.'),
('Dumbbell Row',            'Back',  ARRAY['Biceps'],                'Dumbbells',  'beginner',     'Support with one hand. Row dumbbell to hip. Squeeze lat.'),
('T-Bar Row',               'Back',  ARRAY['Biceps'],                'Barbell',    'intermediate', 'Straddle bar. Grip handles. Row to chest.'),
('Face Pull',               'Back',  ARRAY['Rear Delts','Rotator'],  'Cable',      'beginner',     'Set cable at face height. Pull to face with elbows high.'),
-- SHOULDERS
('Overhead Press',          'Shoulders', ARRAY['Triceps'],           'Barbell',    'intermediate', 'Press bar from shoulders to lockout overhead.'),
('Dumbbell Shoulder Press', 'Shoulders', ARRAY['Triceps'],           'Dumbbells',  'beginner',     'Press dumbbells from shoulders to overhead. Control descent.'),
('Lateral Raise',           'Shoulders', ARRAY[],                    'Dumbbells',  'beginner',     'Raise arms to side to shoulder height. Slight elbow bend.'),
('Front Raise',             'Shoulders', ARRAY[],                    'Dumbbells',  'beginner',     'Raise one or both arms to shoulder height in front.'),
('Arnold Press',            'Shoulders', ARRAY['Triceps'],           'Dumbbells',  'intermediate', 'Start with palms facing you. Rotate and press overhead.'),
('Rear Delt Fly',           'Shoulders', ARRAY['Traps'],             'Dumbbells',  'beginner',     'Bent over, raise arms out to sides with slight bend.'),
-- ARMS
('Barbell Curl',            'Arms',  ARRAY[],                        'Barbell',    'beginner',     'Curl bar from hips to shoulders. Keep elbows still.'),
('Dumbbell Curl',           'Arms',  ARRAY[],                        'Dumbbells',  'beginner',     'Alternate or simultaneous curl. Supinate at top.'),
('Hammer Curl',             'Arms',  ARRAY['Brachialis'],            'Dumbbells',  'beginner',     'Curl with neutral grip (palms facing in).'),
('Tricep Pushdown',         'Arms',  ARRAY[],                        'Cable',      'beginner',     'Push cable down with elbows at sides. Squeeze at bottom.'),
('Skull Crusher',           'Arms',  ARRAY[],                        'Barbell',    'intermediate', 'Lower bar to forehead. Extend up. Keep upper arms vertical.'),
('Close-Grip Bench Press',  'Arms',  ARRAY['Chest'],                 'Barbell',    'intermediate', 'Grip bar shoulder-width. Lower to chest. Tricep focus.'),
('Preacher Curl',           'Arms',  ARRAY[],                        'Barbell',    'beginner',     'Rest arms on pad. Full range curl. Slow negative.'),
('Dip (Triceps)',           'Arms',  ARRAY['Chest'],                 'Bodyweight', 'intermediate', 'Keep torso upright. Lower until elbows 90°. Push up.'),
-- LEGS
('Back Squat',              'Legs',  ARRAY['Glutes','Core'],         'Barbell',    'intermediate', 'Bar on traps. Squat until thighs parallel. Drive through heels.'),
('Front Squat',             'Legs',  ARRAY['Core'],                  'Barbell',    'advanced',     'Bar in front rack. Upright torso. Squat deep.'),
('Romanian Deadlift',       'Legs',  ARRAY['Glutes'],                'Barbell',    'intermediate', 'Hinge at hips. Lower bar along legs. Feel hamstring stretch.'),
('Leg Press',               'Legs',  ARRAY['Glutes'],                'Machine',    'beginner',     'Press platform away. Don''t lock knees. Control descent.'),
('Bulgarian Split Squat',   'Legs',  ARRAY['Glutes'],                'Dumbbells',  'intermediate', 'Rear foot elevated. Lower rear knee toward floor.'),
('Leg Curl',                'Legs',  ARRAY[],                        'Machine',    'beginner',     'Curl legs toward glutes. Hold at top. Lower slowly.'),
('Leg Extension',           'Legs',  ARRAY[],                        'Machine',    'beginner',     'Extend legs to straight. Control descent.'),
('Calf Raise',              'Legs',  ARRAY[],                        'Bodyweight', 'beginner',     'Rise onto toes. Hold. Lower slowly below platform.'),
('Hip Thrust',              'Legs',  ARRAY['Glutes','Hamstrings'],   'Barbell',    'intermediate', 'Shoulders on bench. Drive bar up with glutes. Squeeze at top.'),
('Goblet Squat',            'Legs',  ARRAY['Core'],                  'Dumbbells',  'beginner',     'Hold dumbbell at chest. Squat with elbows inside knees.'),
-- CORE
('Plank',                   'Core',  ARRAY[],                        'Bodyweight', 'beginner',     'Hold straight-body position on forearms. Brace core.'),
('Crunch',                  'Core',  ARRAY[],                        'Bodyweight', 'beginner',     'Lie flat. Curl shoulders toward hips. Don''t pull neck.'),
('Hanging Leg Raise',       'Core',  ARRAY[],                        'Bodyweight', 'intermediate', 'Hang from bar. Raise straight legs to 90°.'),
('Cable Crunch',            'Core',  ARRAY[],                        'Cable',      'beginner',     'Kneel, cable overhead. Crunch elbows to knees.'),
('Russian Twist',           'Core',  ARRAY[],                        'Bodyweight', 'beginner',     'Sit with feet raised. Rotate torso side to side.'),
('Ab Wheel Rollout',        'Core',  ARRAY['Shoulders'],             'Other',      'advanced',     'Kneel with wheel. Roll forward, extend, roll back.'),
('Dead Bug',                'Core',  ARRAY[],                        'Bodyweight', 'beginner',     'Lie on back. Extend opposite arm/leg. Keep lower back down.'),
-- CARDIO
('Treadmill Run',           'Cardio', ARRAY[],                       'Machine',    'beginner',     'Maintain steady pace. Keep upright posture.'),
('Jump Rope',               'Cardio', ARRAY[],                       'Other',      'beginner',     'Jump with both feet or alternating. Keep rhythm.'),
('Rowing Machine',          'Cardio', ARRAY['Back','Arms'],          'Machine',    'beginner',     'Drive with legs first, then lean back, then pull arms.'),
('Burpees',                 'Cardio', ARRAY['Chest','Core'],         'Bodyweight', 'intermediate', 'Drop to push-up, jump feet in, explode up.'),
('Box Jump',                'Cardio', ARRAY['Legs'],                 'Bodyweight', 'intermediate', 'Squat, explode up onto box. Land softly. Step down.'),
('Battle Ropes',            'Cardio', ARRAY['Shoulders','Arms'],     'Other',      'intermediate', 'Alternate or simultaneous wave motion. Drive from hips.'),
('Cycling',                 'Cardio', ARRAY['Legs'],                 'Machine',    'beginner',     'Maintain comfortable cadence. Adjust resistance as needed.')
ON CONFLICT DO NOTHING;