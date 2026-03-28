const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// GET /api/nutrition/logs?date=2024-01-15
exports.getLogs = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `SELECT * FROM nutrition_logs
       WHERE user_id=$1 AND log_date=$2
       ORDER BY meal_type, created_at`,
      [req.user.id, targetDate]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/nutrition/logs
exports.addLog = async (req, res, next) => {
  try {
    const {
      food_name, brand, meal_type, serving_size, serving_unit,
      calories, protein_g, carbs_g, fat_g, fiber_g, log_date
    } = req.body;

    const result = await db.query(
      `INSERT INTO nutrition_logs
        (id, user_id, food_name, brand, meal_type, serving_size, serving_unit,
         calories, protein_g, carbs_g, fat_g, fiber_g, log_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [uuidv4(), req.user.id, food_name, brand, meal_type, serving_size, serving_unit,
        calories, protein_g || 0, carbs_g || 0, fat_g || 0, fiber_g || 0,
      log_date || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json(result.rows[0]);
    // Fire achievement check async — don't block response
    const { checkAndUnlock } = require('./achievementController');
    checkAndUnlock(req.user.id).catch(() => { });
  } catch (err) {
    next(err);
  }
};

// PUT /api/nutrition/logs/:id
exports.updateLog = async (req, res, next) => {
  try {
    const { serving_size, calories, protein_g, carbs_g, fat_g, fiber_g } = req.body;

    const result = await db.query(
      `UPDATE nutrition_logs
       SET serving_size=$1, calories=$2, protein_g=$3, carbs_g=$4, fat_g=$5, fiber_g=$6, updated_at=NOW()
       WHERE id=$7 AND user_id=$8
       RETURNING *`,
      [serving_size, calories, protein_g, carbs_g, fat_g, fiber_g, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log entry not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/nutrition/logs/:id
exports.deleteLog = async (req, res, next) => {
  try {
    await db.query(
      `DELETE FROM nutrition_logs WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Log entry deleted.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/nutrition/goals
exports.getGoals = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT calories_goal, protein_goal, carbs_goal, fat_goal
       FROM user_profiles WHERE user_id=$1`,
      [req.user.id]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    next(err);
  }
};

// PUT /api/nutrition/goals
exports.updateGoals = async (req, res, next) => {
  try {
    const { calories_goal, protein_goal, carbs_goal, fat_goal } = req.body;

    await db.query(
      `UPDATE user_profiles
       SET calories_goal=$1, protein_goal=$2, carbs_goal=$3, fat_goal=$4
       WHERE user_id=$5`,
      [calories_goal, protein_goal, carbs_goal, fat_goal, req.user.id]
    );
    res.json({ message: 'Nutrition goals updated.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/nutrition/summary?date=2024-01-15
exports.getDailySummary = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `SELECT
        COALESCE(SUM(calories), 0)   AS total_calories,
        COALESCE(SUM(protein_g), 0)  AS total_protein,
        COALESCE(SUM(carbs_g), 0)    AS total_carbs,
        COALESCE(SUM(fat_g), 0)      AS total_fat,
        COALESCE(SUM(fiber_g), 0)    AS total_fiber,
        json_object_agg(meal_type, meal_totals) AS by_meal
       FROM (
         SELECT meal_type,
           SUM(calories) AS calories,
           SUM(protein_g) AS protein_g,
           SUM(carbs_g) AS carbs_g,
           SUM(fat_g) AS fat_g,
           SUM(fiber_g) AS fiber_g,
           json_build_object(
             'calories', SUM(calories),
             'protein', SUM(protein_g),
             'carbs', SUM(carbs_g),
             'fat', SUM(fat_g)
           ) AS meal_totals
         FROM nutrition_logs
         WHERE user_id=$1 AND log_date=$2
         GROUP BY meal_type
       ) sub`,
      [req.user.id, targetDate]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/nutrition/weekly
exports.getWeeklySummary = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT log_date,
        SUM(calories) AS total_calories,
        SUM(protein_g) AS total_protein,
        SUM(carbs_g) AS total_carbs,
        SUM(fat_g) AS total_fat
       FROM nutrition_logs
       WHERE user_id=$1 AND log_date >= NOW() - INTERVAL '7 days'
       GROUP BY log_date
       ORDER BY log_date`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/nutrition/foods?q=chicken
exports.searchFoods = async (req, res, next) => {
  try {
    const { q = '' } = req.query;
    const query = q.toLowerCase().trim();

    const foods = FOOD_DATABASE.filter(f =>
      f.name.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query)
    ).slice(0, 20);

    res.json(foods);
  } catch (err) { next(err); }
};

// ── Built-in food database ────────────────────────────────────
const FOOD_DATABASE = [
  // ── Proteins ──
  { name: 'Chicken breast (cooked)', category: 'Protein', serving: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  { name: 'Chicken thigh (cooked)', category: 'Protein', serving: '100g', calories: 209, protein: 26, carbs: 0, fat: 11, fiber: 0 },
  { name: 'Salmon fillet', category: 'Protein', serving: '100g', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
  { name: 'Tuna (canned in water)', category: 'Protein', serving: '100g', calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0 },
  { name: 'Lean beef mince (cooked)', category: 'Protein', serving: '100g', calories: 215, protein: 26, carbs: 0, fat: 12, fiber: 0 },
  { name: 'Egg (whole)', category: 'Protein', serving: '1 egg', calories: 70, protein: 6, carbs: 0.5, fat: 5, fiber: 0 },
  { name: 'Egg white', category: 'Protein', serving: '1 white', calories: 17, protein: 3.6, carbs: 0.2, fat: 0, fiber: 0 },
  { name: 'Whey protein powder', category: 'Protein', serving: '1 scoop (30g)', calories: 120, protein: 25, carbs: 3, fat: 2, fiber: 0 },
  { name: 'Greek yogurt (0% fat)', category: 'Protein', serving: '100g', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 },
  { name: 'Cottage cheese', category: 'Protein', serving: '100g', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0 },
  { name: 'Turkey breast (cooked)', category: 'Protein', serving: '100g', calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0 },
  { name: 'Tilapia fillet', category: 'Protein', serving: '100g', calories: 96, protein: 20, carbs: 0, fat: 1.7, fiber: 0 },
  { name: 'Shrimp (cooked)', category: 'Protein', serving: '100g', calories: 99, protein: 24, carbs: 0, fat: 0.3, fiber: 0 },
  { name: 'Pork tenderloin', category: 'Protein', serving: '100g', calories: 143, protein: 26, carbs: 0, fat: 3.5, fiber: 0 },
  { name: 'Tofu (firm)', category: 'Protein', serving: '100g', calories: 76, protein: 8, carbs: 1.9, fat: 4.2, fiber: 0.3 },
  { name: 'Tempeh', category: 'Protein', serving: '100g', calories: 193, protein: 19, carbs: 9, fat: 11, fiber: 0 },
  { name: 'Edamame', category: 'Protein', serving: '100g', calories: 121, protein: 11, carbs: 10, fat: 5, fiber: 5 },
  { name: 'Black beans (cooked)', category: 'Protein', serving: '100g', calories: 132, protein: 9, carbs: 24, fat: 0.5, fiber: 8.7 },
  { name: 'Chickpeas (cooked)', category: 'Protein', serving: '100g', calories: 164, protein: 9, carbs: 27, fat: 2.6, fiber: 7.6 },
  { name: 'Lentils (cooked)', category: 'Protein', serving: '100g', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },

  // ── Carbs ──
  { name: 'White rice (cooked)', category: 'Carbs', serving: '100g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  { name: 'Brown rice (cooked)', category: 'Carbs', serving: '100g', calories: 112, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8 },
  { name: 'Oats (dry)', category: 'Carbs', serving: '100g', calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10 },
  { name: 'Sweet potato (cooked)', category: 'Carbs', serving: '100g', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3.3 },
  { name: 'White potato (cooked)', category: 'Carbs', serving: '100g', calories: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8 },
  { name: 'Quinoa (cooked)', category: 'Carbs', serving: '100g', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8 },
  { name: 'Whole wheat bread', category: 'Carbs', serving: '1 slice (35g)', calories: 81, protein: 4, carbs: 15, fat: 1.1, fiber: 1.9 },
  { name: 'White bread', category: 'Carbs', serving: '1 slice (30g)', calories: 79, protein: 2.7, carbs: 15, fat: 1, fiber: 0.6 },
  { name: 'Pasta (cooked)', category: 'Carbs', serving: '100g', calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8 },
  { name: 'Banana', category: 'Carbs', serving: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1 },
  { name: 'Apple', category: 'Carbs', serving: '1 medium (182g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 },
  { name: 'Orange', category: 'Carbs', serving: '1 medium (131g)', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1 },
  { name: 'Blueberries', category: 'Carbs', serving: '100g', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4 },
  { name: 'Strawberries', category: 'Carbs', serving: '100g', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2 },
  { name: 'Rice cakes (plain)', category: 'Carbs', serving: '1 cake (9g)', calories: 35, protein: 0.7, carbs: 7.3, fat: 0.3, fiber: 0.3 },
  { name: 'Corn tortilla', category: 'Carbs', serving: '1 tortilla (26g)', calories: 52, protein: 1.4, carbs: 11, fat: 0.7, fiber: 1.5 },

  // ── Fats ──
  { name: 'Avocado', category: 'Fats', serving: '1 half (68g)', calories: 114, protein: 1.3, carbs: 6, fat: 10.5, fiber: 4.6 },
  { name: 'Olive oil', category: 'Fats', serving: '1 tbsp (14g)', calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0 },
  { name: 'Coconut oil', category: 'Fats', serving: '1 tbsp (14g)', calories: 121, protein: 0, carbs: 0, fat: 13.5, fiber: 0 },
  { name: 'Peanut butter', category: 'Fats', serving: '2 tbsp (32g)', calories: 188, protein: 8, carbs: 6, fat: 16, fiber: 1.9 },
  { name: 'Almond butter', category: 'Fats', serving: '2 tbsp (32g)', calories: 196, protein: 7, carbs: 6, fat: 18, fiber: 3.3 },
  { name: 'Almonds', category: 'Fats', serving: '30g', calories: 174, protein: 6, carbs: 6, fat: 15, fiber: 3.5 },
  { name: 'Walnuts', category: 'Fats', serving: '30g', calories: 196, protein: 4.6, carbs: 4.1, fat: 19.6, fiber: 2 },
  { name: 'Cashews', category: 'Fats', serving: '30g', calories: 163, protein: 4.3, carbs: 9.2, fat: 13, fiber: 0.9 },
  { name: 'Chia seeds', category: 'Fats', serving: '2 tbsp (20g)', calories: 97, protein: 3.3, carbs: 8.4, fat: 6.1, fiber: 6.9 },
  { name: 'Flax seeds', category: 'Fats', serving: '1 tbsp (10g)', calories: 55, protein: 1.9, carbs: 3, fat: 4.3, fiber: 2.8 },
  { name: 'Whole milk', category: 'Dairy', serving: '240ml', calories: 146, protein: 8, carbs: 12, fat: 8, fiber: 0 },
  { name: 'Skimmed milk', category: 'Dairy', serving: '240ml', calories: 83, protein: 8, carbs: 12, fat: 0.2, fiber: 0 },
  { name: 'Cheddar cheese', category: 'Dairy', serving: '30g', calories: 120, protein: 7, carbs: 0.4, fat: 10, fiber: 0 },
  { name: 'Mozzarella cheese', category: 'Dairy', serving: '30g', calories: 85, protein: 6.3, carbs: 0.6, fat: 6.3, fiber: 0 },

  // ── Vegetables ──
  { name: 'Broccoli', category: 'Vegetables', serving: '100g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  { name: 'Spinach', category: 'Vegetables', serving: '100g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  { name: 'Kale', category: 'Vegetables', serving: '100g', calories: 49, protein: 4.3, carbs: 9, fat: 0.9, fiber: 3.6 },
  { name: 'Mixed salad leaves', category: 'Vegetables', serving: '100g', calories: 20, protein: 1.5, carbs: 3, fat: 0.3, fiber: 1.5 },
  { name: 'Cucumber', category: 'Vegetables', serving: '100g', calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 },
  { name: 'Tomato', category: 'Vegetables', serving: '100g', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  { name: 'Bell pepper', category: 'Vegetables', serving: '100g', calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1 },
  { name: 'Asparagus', category: 'Vegetables', serving: '100g', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1 },
  { name: 'Green beans', category: 'Vegetables', serving: '100g', calories: 31, protein: 1.8, carbs: 7, fat: 0.1, fiber: 2.7 },
  { name: 'Zucchini', category: 'Vegetables', serving: '100g', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1 },
  { name: 'Mushrooms', category: 'Vegetables', serving: '100g', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1 },
  { name: 'Onion', category: 'Vegetables', serving: '100g', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
  { name: 'Carrot', category: 'Vegetables', serving: '100g', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8 },

  // ── Fast food / common meals ──
  { name: 'Chicken rice bowl', category: 'Meals', serving: '1 bowl (400g)', calories: 520, protein: 40, carbs: 60, fat: 10, fiber: 3 },
  { name: 'Beef burger (no bun)', category: 'Meals', serving: '1 patty (150g)', calories: 340, protein: 28, carbs: 0, fat: 24, fiber: 0 },
  { name: 'Pizza (cheese slice)', category: 'Meals', serving: '1 slice (107g)', calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2 },
  { name: 'Caesar salad', category: 'Meals', serving: '300g', calories: 350, protein: 10, carbs: 15, fat: 28, fiber: 3 },
  { name: 'Protein bar (average)', category: 'Snacks', serving: '1 bar (60g)', calories: 220, protein: 20, carbs: 22, fat: 7, fiber: 3 },
  { name: 'Dark chocolate (70%)', category: 'Snacks', serving: '30g', calories: 170, protein: 2.5, carbs: 13, fat: 12, fiber: 3 },
  { name: 'Granola', category: 'Snacks', serving: '50g', calories: 224, protein: 4.8, carbs: 34, fat: 8.6, fiber: 2.8 },

  // ── Drinks ──
  { name: 'Orange juice', category: 'Drinks', serving: '240ml', calories: 111, protein: 1.7, carbs: 26, fat: 0.5, fiber: 0.5 },
  { name: 'Protein shake (milk)', category: 'Drinks', serving: '350ml', calories: 270, protein: 30, carbs: 18, fat: 6, fiber: 0 },
  { name: 'Black coffee', category: 'Drinks', serving: '240ml', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0 },
  { name: 'Skimmed latte', category: 'Drinks', serving: '360ml', calories: 100, protein: 10, carbs: 15, fat: 0, fiber: 0 },
];