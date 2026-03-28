import { useState, useEffect } from 'react';
import {
  Apple, Plus, ChevronDown, ChevronUp,
  Calculator, Zap, ArrowRight, Check,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';

// ── Calorie calculation ───────────────────────────────────────
function calcBMR(weight, height, age, gender) {
  if (gender === 'female')
    return 10 * weight + 6.25 * height - 5 * age - 161;
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

const ACTIVITY = {
  sedentary: { label: 'Sedentary - desk job, no exercise', mult: 1.2 },
  light: { label: 'Lightly active - 1 to 3 days per week', mult: 1.375 },
  moderate: { label: 'Moderately active - 3 to 5 days per week', mult: 1.55 },
  active: { label: 'Very active - 6 to 7 days per week', mult: 1.725 },
  extra_active: { label: 'Extra active - 2x per day or physical job', mult: 1.9 },
};

const GOALS = {
  aggressive_cut: { label: 'Aggressive cut (-500 kcal)', kcal: -500, pMult: 2.4 },
  moderate_cut: { label: 'Moderate cut (-300 kcal)', kcal: -300, pMult: 2.2 },
  maintain: { label: 'Maintain weight (0 kcal)', kcal: 0, pMult: 1.8 },
  moderate_bulk: { label: 'Moderate bulk (+300 kcal)', kcal: +300, pMult: 2.0 },
  aggressive_bulk: { label: 'Aggressive bulk (+500 kcal)', kcal: +500, pMult: 2.2 },
};

function calcTargets(profile, activityKey, goalKey) {
  const bmr = calcBMR(
    Number(profile.weight_kg), Number(profile.height_cm),
    Number(profile.age), profile.gender
  );
  const tdee = Math.round(bmr * ACTIVITY[activityKey].mult);
  const goal = GOALS[goalKey];
  const cal = Math.round(tdee + goal.kcal);
  const protein = Math.round(Number(profile.weight_kg) * goal.pMult);
  const fat = Math.round((cal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((cal - protein * 4 - fat * 9) / 4));
  return { bmr, tdee, calories: cal, protein, carbs, fat };
}

// ── Meal plan generator ───────────────────────────────────────
// Food database with macros per 100g or per unit
const FOOD_DB = {
  // Proteins
  chicken_breast: { name: 'Chicken breast', per100: { cal: 165, p: 31, c: 0, f: 3.6 }, unit: 'g' },
  salmon: { name: 'Salmon fillet', per100: { cal: 208, p: 20, c: 0, f: 13 }, unit: 'g' },
  tuna_canned: { name: 'Tuna (canned)', per100: { cal: 116, p: 26, c: 0, f: 1 }, unit: 'g' },
  eggs: { name: 'Whole eggs', perUnit: { cal: 70, p: 6, c: 0.5, f: 5 }, unit: 'egg' },
  egg_whites: { name: 'Egg whites', perUnit: { cal: 17, p: 3.6, c: 0.2, f: 0.1 }, unit: 'white' },
  greek_yogurt: { name: 'Greek yogurt', per100: { cal: 59, p: 10, c: 3.6, f: 0.4 }, unit: 'g' },
  cottage_cheese: { name: 'Cottage cheese', per100: { cal: 98, p: 11, c: 3.4, f: 4.3 }, unit: 'g' },
  whey_protein: { name: 'Whey protein', perUnit: { cal: 120, p: 25, c: 3, f: 2 }, unit: 'scoop' },
  lean_beef: { name: 'Lean beef mince', per100: { cal: 215, p: 26, c: 0, f: 12 }, unit: 'g' },
  tilapia: { name: 'Tilapia', per100: { cal: 96, p: 20, c: 0, f: 1.7 }, unit: 'g' },
  turkey_breast: { name: 'Turkey breast', per100: { cal: 135, p: 30, c: 0, f: 1 }, unit: 'g' },
  // Carbs
  oats: { name: 'Oats', per100: { cal: 389, p: 17, c: 66, f: 7 }, unit: 'g' },
  white_rice: { name: 'White rice', per100: { cal: 130, p: 2.7, c: 28, f: 0.3 }, unit: 'g' },
  brown_rice: { name: 'Brown rice', per100: { cal: 112, p: 2.6, c: 23, f: 0.9 }, unit: 'g' },
  sweet_potato: { name: 'Sweet potato', per100: { cal: 86, p: 1.6, c: 20, f: 0.1 }, unit: 'g' },
  banana: { name: 'Banana', perUnit: { cal: 89, p: 1.1, c: 23, f: 0.3 }, unit: 'banana' },
  bread_wg: { name: 'Wholegrain bread', perUnit: { cal: 69, p: 3.6, c: 12, f: 1 }, unit: 'slice' },
  quinoa: { name: 'Quinoa', per100: { cal: 120, p: 4.4, c: 21, f: 1.9 }, unit: 'g' },
  // Fats
  avocado: { name: 'Avocado', perUnit: { cal: 160, p: 2, c: 9, f: 15 }, unit: 'half' },
  almonds: { name: 'Almonds', per100: { cal: 579, p: 21, c: 22, f: 50 }, unit: 'g' },
  olive_oil: { name: 'Olive oil', perUnit: { cal: 119, p: 0, c: 0, f: 13.5 }, unit: 'tbsp' },
  peanut_butter: { name: 'Peanut butter', perUnit: { cal: 94, p: 4, c: 3, f: 8 }, unit: 'tbsp' },
  // Vegetables (low cal fillers)
  broccoli: { name: 'Broccoli', per100: { cal: 34, p: 2.8, c: 7, f: 0.4 }, unit: 'g' },
  spinach: { name: 'Spinach', per100: { cal: 23, p: 2.9, c: 3.6, f: 0.4 }, unit: 'g' },
  mixed_veg: { name: 'Mixed vegetables', per100: { cal: 40, p: 2, c: 8, f: 0.5 }, unit: 'g' },
  green_beans: { name: 'Green beans', per100: { cal: 31, p: 1.8, c: 7, f: 0.1 }, unit: 'g' },
  // Dairy
  milk_whole: { name: 'Whole milk', per100: { cal: 61, p: 3.2, c: 4.8, f: 3.3 }, unit: 'ml' },
  // Other
  blueberries: { name: 'Blueberries', per100: { cal: 57, p: 0.7, c: 14, f: 0.3 }, unit: 'g' },
};

function getFood(key, amount) {
  const f = FOOD_DB[key];
  if (!f) return null;
  let cal, p, c, fat, serving;
  if (f.per100) {
    const ratio = amount / 100;
    cal = Math.round(f.per100.cal * ratio);
    p = Math.round(f.per100.p * ratio * 10) / 10;
    c = Math.round(f.per100.c * ratio * 10) / 10;
    fat = Math.round(f.per100.f * ratio * 10) / 10;
    serving = `${amount}${f.unit}`;
  } else {
    cal = Math.round(f.perUnit.cal * amount);
    p = Math.round(f.perUnit.p * amount * 10) / 10;
    c = Math.round(f.perUnit.c * amount * 10) / 10;
    fat = Math.round(f.perUnit.f * amount * 10) / 10;
    serving = amount === 1 ? `1 ${f.unit}` : `${amount} ${f.unit}s`;
  }
  return { name: f.name, calories: cal, protein: p, carbs: c, fat, serving };
}

// Scale a food item to hit a target calorie amount
function scaleFood(key, targetCal) {
  const f = FOOD_DB[key];
  if (!f) return null;
  const calPer = f.per100 ? f.per100.cal / 100 : f.perUnit.cal;
  const amount = f.per100
    ? Math.round(targetCal / calPer)
    : Math.max(1, Math.round(targetCal / calPer));
  return getFood(key, amount);
}

function generateMealPlan(targets, dietType) {
  const { calories, protein, carbs, fat } = targets;

  // Meal calorie splits
  const splits = {
    breakfast: Math.round(calories * 0.25),
    lunch: Math.round(calories * 0.30),
    snack: Math.round(calories * 0.15),
    dinner: Math.round(calories * 0.30),
  };

  // Choose protein sources based on diet type
  const isVeg = dietType === 'vegetarian' || dietType === 'vegan';
  const isKeto = dietType === 'keto';
  const isHigh = protein > 200;

  // ── Build each meal ──────────────────────────────────────────

  // BREAKFAST
  let breakfast = [];
  if (isKeto) {
    const eggsAmt = Math.max(2, Math.round(splits.breakfast * 0.4 / 70));
    breakfast = [
      getFood('eggs', eggsAmt),
      getFood('egg_whites', Math.round(splits.breakfast * 0.15 / 17)),
      scaleFood('avocado', splits.breakfast * 0.35),
    ].filter(Boolean);
  } else if (isVeg) {
    const oatsAmt = Math.round((splits.breakfast * 0.4) / (389 / 100));
    breakfast = [
      getFood('oats', Math.max(40, oatsAmt)),
      getFood('greek_yogurt', Math.max(150, Math.round(splits.breakfast * 0.3 / (59 / 100)))),
      getFood('blueberries', 100),
      getFood('whey_protein', 1),
    ].filter(Boolean);
  } else if (isHigh) {
    breakfast = [
      getFood('egg_whites', Math.round(splits.breakfast * 0.4 / 17)),
      getFood('eggs', 2),
      getFood('oats', Math.round(splits.breakfast * 0.3 / (389 / 100))),
    ].filter(Boolean);
  } else {
    breakfast = [
      getFood('oats', Math.max(60, Math.round(splits.breakfast * 0.45 / (389 / 100)))),
      getFood('greek_yogurt', 150),
      getFood('banana', 1),
    ].filter(Boolean);
  }

  // LUNCH
  let lunch = [];
  const lunchProteinCal = splits.lunch * 0.45;
  if (isKeto) {
    lunch = [
      scaleFood('chicken_breast', lunchProteinCal * 0.7),
      getFood('broccoli', 200),
      getFood('olive_oil', 2),
    ].filter(Boolean);
  } else if (isVeg) {
    const riceAmt = Math.round(splits.lunch * 0.35 / (112 / 100));
    lunch = [
      getFood('greek_yogurt', 200),
      getFood('brown_rice', Math.max(100, riceAmt)),
      getFood('mixed_veg', 200),
      getFood('olive_oil', 1),
    ].filter(Boolean);
  } else {
    const riceAmt = Math.round(splits.lunch * 0.30 / (130 / 100));
    const chickenAmt = Math.round(lunchProteinCal / (165 / 100));
    lunch = [
      getFood('chicken_breast', Math.max(150, chickenAmt)),
      getFood(isHigh ? 'brown_rice' : 'white_rice', Math.max(100, riceAmt)),
      getFood('broccoli', 200),
    ].filter(Boolean);
  }

  // SNACK
  let snack = [];
  if (isKeto) {
    snack = [
      getFood('almonds', Math.round(splits.snack * 0.6 / (579 / 100))),
      getFood('cottage_cheese', 100),
    ].filter(Boolean);
  } else if (isVeg) {
    snack = [
      getFood('greek_yogurt', 200),
      getFood('almonds', 30),
    ].filter(Boolean);
  } else {
    snack = [
      getFood('whey_protein', 1),
      getFood(carbs > 150 ? 'banana' : 'almonds', carbs > 150 ? 1 : 30),
    ].filter(Boolean);
  }

  // DINNER
  let dinner = [];
  const dinnerProteinCal = splits.dinner * 0.40;
  if (isKeto) {
    dinner = [
      scaleFood('salmon', dinnerProteinCal),
      getFood('spinach', 150),
      getFood('olive_oil', 2),
      getFood('avocado', 1),
    ].filter(Boolean);
  } else if (isVeg) {
    const qAmt = Math.round(splits.dinner * 0.30 / (120 / 100));
    dinner = [
      getFood('eggs', 3),
      getFood('quinoa', Math.max(100, qAmt)),
      getFood('mixed_veg', 200),
      getFood('olive_oil', 1),
    ].filter(Boolean);
  } else {
    const protSrc = isHigh ? 'lean_beef' : protein > 160 ? 'salmon' : 'tilapia';
    const protAmt = Math.round(dinnerProteinCal / ((FOOD_DB[protSrc].per100?.cal || 165) / 100));
    const spAmt = Math.round(splits.dinner * 0.25 / (86 / 100));
    dinner = [
      getFood(protSrc, Math.max(150, protAmt)),
      getFood('sweet_potato', Math.max(100, spAmt)),
      getFood('green_beans', 150),
    ].filter(Boolean);
  }

  // Optionally add pre-sleep meal for high protein / bulk
  const meals = [
    { name: 'Breakfast', foods: breakfast.filter(Boolean) },
    { name: 'Lunch', foods: lunch.filter(Boolean) },
    { name: 'Snack', foods: snack.filter(Boolean) },
    { name: 'Dinner', foods: dinner.filter(Boolean) },
  ];

  if (protein > 180 || targets.calories > 2800) {
    meals.push({
      name: 'Before Bed',
      foods: [
        getFood('cottage_cheese', Math.round(targets.calories * 0.08 / (98 / 100))),
        getFood('almonds', 20),
      ].filter(Boolean),
    });
  }

  // Calculate totals
  const totals = meals.reduce((acc, meal) => {
    meal.foods.forEach(f => {
      acc.calories += f.calories;
      acc.protein += f.protein;
      acc.carbs += f.carbs;
      acc.fat += f.fat;
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return { meals, totals };
}

// ── Pre-built templates ───────────────────────────────────────
const PLAN_TEMPLATES = [
  {
    key: 'bulking', label: 'Bulking', desc: 'High calorie surplus for muscle gain',
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    baseCalories: 3200, baseProtein: 220, baseCarbs: 380, baseFat: 90,
    meals: [
      {
        name: 'Breakfast', foods: [
          { name: 'Oats', calories: 300, protein: 10, carbs: 54, fat: 5, serving: '80g' },
          { name: 'Whole milk', calories: 150, protein: 8, carbs: 12, fat: 8, serving: '250ml' },
          { name: 'Banana', calories: 90, protein: 1, carbs: 23, fat: 0, serving: '1 large' },
          { name: 'Whey protein', calories: 120, protein: 25, carbs: 3, fat: 2, serving: '1 scoop' },
        ]
      },
      {
        name: 'Lunch', foods: [
          { name: 'Chicken breast', calories: 330, protein: 62, carbs: 0, fat: 7, serving: '250g' },
          { name: 'White rice', calories: 340, protein: 6, carbs: 75, fat: 1, serving: '200g' },
          { name: 'Olive oil', calories: 120, protein: 0, carbs: 0, fat: 14, serving: '1 tbsp' },
          { name: 'Broccoli', calories: 55, protein: 4, carbs: 11, fat: 1, serving: '200g' },
        ]
      },
      {
        name: 'Pre-Workout', foods: [
          { name: 'Greek yogurt', calories: 130, protein: 17, carbs: 9, fat: 0, serving: '200g' },
          { name: 'Blueberries', calories: 85, protein: 1, carbs: 21, fat: 0, serving: '150g' },
        ]
      },
      {
        name: 'Dinner', foods: [
          { name: 'Salmon fillet', calories: 350, protein: 40, carbs: 0, fat: 20, serving: '200g' },
          { name: 'Sweet potato', calories: 180, protein: 3, carbs: 41, fat: 0, serving: '200g' },
          { name: 'Mixed salad', calories: 50, protein: 3, carbs: 8, fat: 1, serving: '100g' },
        ]
      },
      {
        name: 'Before Bed', foods: [
          { name: 'Cottage cheese', calories: 140, protein: 20, carbs: 5, fat: 4, serving: '200g' },
          { name: 'Almonds', calories: 170, protein: 6, carbs: 6, fat: 15, serving: '30g' },
        ]
      },
    ],
  },
  {
    key: 'cutting', label: 'Cutting', desc: 'Calorie deficit preserving muscle',
    color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    baseCalories: 1900, baseProtein: 190, baseCarbs: 160, baseFat: 60,
    meals: [
      {
        name: 'Breakfast', foods: [
          { name: 'Egg whites', calories: 100, protein: 21, carbs: 2, fat: 0, serving: '6 whites' },
          { name: 'Whole egg', calories: 70, protein: 6, carbs: 0, fat: 5, serving: '1 large' },
          { name: 'Spinach', calories: 20, protein: 2, carbs: 3, fat: 0, serving: '100g' },
        ]
      },
      {
        name: 'Lunch', foods: [
          { name: 'Chicken breast', calories: 250, protein: 47, carbs: 0, fat: 5, serving: '200g' },
          { name: 'Brown rice', calories: 220, protein: 5, carbs: 46, fat: 2, serving: '150g' },
          { name: 'Asparagus', calories: 40, protein: 4, carbs: 7, fat: 0, serving: '150g' },
        ]
      },
      {
        name: 'Snack', foods: [
          { name: 'Whey protein', calories: 120, protein: 25, carbs: 3, fat: 2, serving: '1 scoop' },
          { name: 'Apple', calories: 80, protein: 0, carbs: 21, fat: 0, serving: '1 medium' },
        ]
      },
      {
        name: 'Dinner', foods: [
          { name: 'Tilapia', calories: 220, protein: 45, carbs: 0, fat: 4, serving: '200g' },
          { name: 'Zucchini', calories: 35, protein: 3, carbs: 6, fat: 0, serving: '200g' },
          { name: 'Quinoa', calories: 185, protein: 7, carbs: 34, fat: 3, serving: '100g' },
        ]
      },
    ],
  },
  {
    key: 'high_protein', label: 'High Protein', desc: 'Maximum protein for muscle growth',
    color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    baseCalories: 2500, baseProtein: 280, baseCarbs: 180, baseFat: 70,
    meals: [
      {
        name: 'Breakfast', foods: [
          { name: 'Chicken sausage', calories: 200, protein: 28, carbs: 2, fat: 9, serving: '150g' },
          { name: 'Egg whites', calories: 100, protein: 21, carbs: 2, fat: 0, serving: '6 whites' },
          { name: 'Oats', calories: 150, protein: 5, carbs: 27, fat: 3, serving: '40g' },
        ]
      },
      {
        name: 'Lunch', foods: [
          { name: 'Tuna (canned)', calories: 180, protein: 40, carbs: 0, fat: 2, serving: '200g' },
          { name: 'Brown rice', calories: 220, protein: 5, carbs: 46, fat: 2, serving: '150g' },
          { name: 'Mixed veggies', calories: 60, protein: 4, carbs: 12, fat: 0, serving: '200g' },
        ]
      },
      {
        name: 'Post-Workout', foods: [
          { name: 'Whey protein', calories: 240, protein: 50, carbs: 6, fat: 4, serving: '2 scoops' },
          { name: 'Banana', calories: 90, protein: 1, carbs: 23, fat: 0, serving: '1 large' },
        ]
      },
      {
        name: 'Dinner', foods: [
          { name: 'Lean beef', calories: 300, protein: 42, carbs: 0, fat: 14, serving: '200g' },
          { name: 'Sweet potato', calories: 180, protein: 3, carbs: 41, fat: 0, serving: '200g' },
          { name: 'Green beans', calories: 35, protein: 2, carbs: 8, fat: 0, serving: '150g' },
        ]
      },
    ],
  },
  {
    key: 'keto', label: 'Keto', desc: 'Very low carb, high fat for ketosis',
    color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    baseCalories: 2100, baseProtein: 160, baseCarbs: 25, baseFat: 155,
    meals: [
      {
        name: 'Breakfast', foods: [
          { name: 'Scrambled eggs', calories: 210, protein: 18, carbs: 1, fat: 15, serving: '3 eggs' },
          { name: 'Bacon', calories: 180, protein: 12, carbs: 0, fat: 14, serving: '60g' },
          { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, serving: '1 half' },
        ]
      },
      {
        name: 'Lunch', foods: [
          { name: 'Chicken thighs', calories: 350, protein: 34, carbs: 0, fat: 23, serving: '200g' },
          { name: 'Caesar salad', calories: 200, protein: 5, carbs: 6, fat: 18, serving: '150g' },
        ]
      },
      {
        name: 'Snack', foods: [
          { name: 'Almonds', calories: 170, protein: 6, carbs: 6, fat: 15, serving: '30g' },
          { name: 'Cheese', calories: 110, protein: 7, carbs: 0, fat: 9, serving: '30g' },
        ]
      },
      {
        name: 'Dinner', foods: [
          { name: 'Ribeye steak', calories: 450, protein: 38, carbs: 0, fat: 32, serving: '200g' },
          { name: 'Asparagus', calories: 40, protein: 4, carbs: 7, fat: 0, serving: '150g' },
        ]
      },
    ],
  },
  {
    key: 'vegetarian', label: 'Vegetarian', desc: 'Plant-based with dairy and eggs',
    color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    baseCalories: 2200, baseProtein: 150, baseCarbs: 260, baseFat: 70,
    meals: [
      {
        name: 'Breakfast', foods: [
          { name: 'Oats', calories: 300, protein: 10, carbs: 54, fat: 5, serving: '80g' },
          { name: 'Chia seeds', calories: 140, protein: 5, carbs: 12, fat: 9, serving: '30g' },
          { name: 'Almond milk', calories: 60, protein: 1, carbs: 8, fat: 3, serving: '250ml' },
          { name: 'Whey protein', calories: 120, protein: 25, carbs: 3, fat: 2, serving: '1 scoop' },
        ]
      },
      {
        name: 'Lunch', foods: [
          { name: 'Lentil soup', calories: 260, protein: 18, carbs: 40, fat: 4, serving: '400ml' },
          { name: 'WG bread', calories: 140, protein: 6, carbs: 28, fat: 2, serving: '2 slices' },
        ]
      },
      {
        name: 'Snack', foods: [
          { name: 'Cottage cheese', calories: 140, protein: 20, carbs: 5, fat: 4, serving: '200g' },
          { name: 'Mixed nuts', calories: 180, protein: 5, carbs: 8, fat: 16, serving: '30g' },
        ]
      },
      {
        name: 'Dinner', foods: [
          { name: 'Tofu stir fry', calories: 280, protein: 22, carbs: 18, fat: 14, serving: '250g' },
          { name: 'Brown rice', calories: 220, protein: 5, carbs: 46, fat: 2, serving: '150g' },
          { name: 'Edamame', calories: 120, protein: 11, carbs: 10, fat: 5, serving: '100g' },
        ]
      },
    ],
  },
  {
    key: 'vegan', label: 'Vegan', desc: 'Fully plant-based nutrition',
    color: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    baseCalories: 2000, baseProtein: 130, baseCarbs: 250, baseFat: 65,
    meals: [
      {
        name: 'Breakfast', foods: [
          { name: 'Smoothie bowl', calories: 350, protein: 12, carbs: 65, fat: 8, serving: '1 bowl' },
          { name: 'Hemp seeds', calories: 160, protein: 10, carbs: 3, fat: 13, serving: '30g' },
          { name: 'Plant protein', calories: 120, protein: 25, carbs: 4, fat: 2, serving: '1 scoop' },
        ]
      },
      {
        name: 'Lunch', foods: [
          { name: 'Chickpea curry', calories: 380, protein: 18, carbs: 55, fat: 10, serving: '400g' },
          { name: 'Brown rice', calories: 220, protein: 5, carbs: 46, fat: 2, serving: '150g' },
        ]
      },
      {
        name: 'Snack', foods: [
          { name: 'Peanut butter', calories: 190, protein: 8, carbs: 6, fat: 16, serving: '2 tbsp' },
          { name: 'Rice cakes', calories: 70, protein: 2, carbs: 16, fat: 0, serving: '2 cakes' },
        ]
      },
      {
        name: 'Dinner', foods: [
          { name: 'Black bean tacos', calories: 380, protein: 18, carbs: 52, fat: 12, serving: '3 tacos' },
          { name: 'Guacamole', calories: 120, protein: 2, carbs: 7, fat: 11, serving: '60g' },
        ]
      },
    ],
  },
];

function toMealType(mealName) {
  const n = mealName.toLowerCase();
  if (n.includes('breakfast')) return 'breakfast';
  if (n.includes('lunch')) return 'lunch';
  if (n.includes('dinner')) return 'dinner';
  if (n.includes('snack')) return 'snack';
  if (n.includes('pre')) return 'snack';   // Pre-Workout
  if (n.includes('post')) return 'snack';   // Post-Workout
  if (n.includes('bed')) return 'snack';   // Before Bed
  return 'snack';                                  // fallback
}

// ── Meal accordion ────────────────────────────────────────────
function MealAccordion({ meal, index }) {
  const [open, setOpen] = useState(index === 0);
  const total = meal.foods.reduce((s, f) => s + f.calories, 0);

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-50 dark:bg-brand-900/20
                          rounded-lg flex items-center justify-center">
            <Apple size={15} className="text-brand-500" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {meal.name}
            </p>
            <p className="text-xs text-zinc-400">
              {total} kcal · {meal.foods.length} items
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-zinc-400" />
          : <ChevronDown size={16} className="text-zinc-400" />}
      </button>

      {open && (
        <div className="border-t border-zinc-50 dark:border-zinc-800 px-5 pb-3">
          <div className="grid grid-cols-12 py-2 text-xs font-semibold
                          text-zinc-400 uppercase tracking-wide">
            <span className="col-span-5">Food</span>
            <span className="col-span-2 text-right">kcal</span>
            <span className="col-span-2 text-right">P</span>
            <span className="col-span-2 text-right">C</span>
            <span className="col-span-1 text-right">F</span>
          </div>
          {meal.foods.map((food, fi) => (
            <div key={fi} className="grid grid-cols-12 py-2.5 border-t
                                     border-zinc-50 dark:border-zinc-800">
              <div className="col-span-5">
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {food.name}
                </p>
                <p className="text-xs text-zinc-400">{food.serving}</p>
              </div>
              <span className="col-span-2 text-right text-xs font-semibold
                               text-zinc-700 dark:text-zinc-300">
                {food.calories}
              </span>
              <span className="col-span-2 text-right text-xs text-blue-500">
                {food.protein}g
              </span>
              <span className="col-span-2 text-right text-xs text-green-500">
                {food.carbs}g
              </span>
              <span className="col-span-1 text-right text-xs text-amber-500">
                {food.fat}g
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Macro summary bar ─────────────────────────────────────────
function MacroSummary({ targets, actual }) {
  const items = [
    { label: 'Calories', t: targets.calories, a: actual.calories, unit: 'kcal', color: 'text-brand-500' },
    { label: 'Protein', t: targets.protein, a: Math.round(actual.protein), unit: 'g', color: 'text-blue-500' },
    { label: 'Carbs', t: targets.carbs, a: Math.round(actual.carbs), unit: 'g', color: 'text-green-500' },
    { label: 'Fat', t: targets.fat, a: Math.round(actual.fat), unit: 'g', color: 'text-amber-500' },
  ];
  return (
    <div className="card p-5">
      <div className="grid grid-cols-4 gap-4 text-center">
        {items.map(({ label, t, a, unit, color }) => {
          const pct = Math.min(100, Math.round((a / t) * 100));
          const diff = a - t;
          return (
            <div key={label}>
              <p className={`text-xl font-bold ${color}`}>
                {a}
                <span className="text-xs font-normal ml-0.5">{unit}</span>
              </p>
              <p className="text-xs text-zinc-400">{label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                target: {t}{unit}
              </p>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800
                              rounded-full h-1 mt-1.5">
                <div className="bg-brand-500 h-1 rounded-full transition-all"
                  style={{ width: `${pct}%` }} />
              </div>
              {Math.abs(diff) > 5 && (
                <p className={`text-xs mt-0.5 ${diff > 0 ? 'text-amber-500' : 'text-blue-500'}`}>
                  {diff > 0 ? `+${diff}${unit} over` : `${Math.abs(diff)}${unit} under`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Smart calculator ──────────────────────────────────────────
function SmartCalculator() {
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState('moderate');
  const [goal, setGoal] = useState('maintain');
  const [dietType, setDietType] = useState('standard');
  const [targets, setTargets] = useState(null);
  const [plan, setPlan] = useState(null);
  const [missing, setMissing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [logMsg, setLogMsg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/profile')
      .then(({ data }) => setProfile(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const calculate = () => {
    const miss = [];
    if (!profile?.weight_kg) miss.push('weight');
    if (!profile?.height_cm) miss.push('height');
    if (!profile?.age) miss.push('age');
    if (!profile?.gender) miss.push('gender');
    if (miss.length) { setMissing(miss); return; }
    setMissing([]);

    const t = calcTargets(profile, activity, goal);
    setTargets(t);

    const generated = generateMealPlan(t, dietType);
    setPlan(generated);
    setSaved(false);
  };

  const regenerate = () => {
    if (!targets) return;
    const generated = generateMealPlan(targets, dietType);
    setPlan(generated);
    setSaved(false);
  };

  const saveGoals = async () => {
    if (!targets) return;
    try {
      await api.put('/nutrition/goals', {
        calories_goal: targets.calories,
        protein_goal: targets.protein,
        carbs_goal: targets.carbs,
        fat_goal: targets.fat,
      });
      setSaved(true);
    } catch (e) { console.error(e); }
  };

  const logToday = async () => {
    if (!plan) return;
    setLogging(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      for (const meal of plan.meals) {
        for (const food of meal.foods) {
          await api.post('/nutrition/logs', {
            food_name: food.name,
            meal_type: toMealType(meal.name),
            serving_size: 1,
            serving_unit: food.serving,
            calories: food.calories,
            protein_g: food.protein,
            carbs_g: food.carbs,
            fat_g: food.fat,
            log_date: today,
          });
        }
      }
      setLogMsg('Plan logged to today\'s nutrition diary!');
      setTimeout(() => setLogMsg(''), 3000);
    } catch (e) { console.error(e); }
    finally { setLogging(false); }
  };

  if (loading) return <div className="card h-40 skeleton" />;

  return (
    <div className="space-y-5">

      {/* Profile data preview */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-brand-50 dark:bg-brand-900/20
                          rounded-xl flex items-center justify-center">
            <Calculator size={18} className="text-brand-500" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Your biometrics
            </h3>
            <p className="text-xs text-zinc-400">
              Pulled from your profile — update in Settings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5 p-3
                        bg-zinc-50 dark:bg-zinc-800 rounded-xl">
          {[
            { label: 'Weight', value: profile?.weight_kg ? `${profile.weight_kg} kg` : '—' },
            { label: 'Height', value: profile?.height_cm ? `${profile.height_cm} cm` : '—' },
            { label: 'Age', value: profile?.age ? `${profile.age} yrs` : '—' },
            { label: 'Body fat', value: profile?.body_fat_pct ? `${profile.body_fat_pct}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {value}
              </p>
              <p className="text-xs text-zinc-400">{label}</p>
            </div>
          ))}
        </div>

        {missing.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20
                          border border-amber-100 dark:border-amber-800
                          text-xs text-amber-700 dark:text-amber-300">
            Missing from profile: <strong>{missing.join(', ')}</strong>.
            Update in Settings to continue.
          </div>
        )}

        {/* Activity */}
        <div className="mb-4">
          <label className="label">Activity level</label>
          <select className="input" value={activity}
            onChange={e => setActivity(e.target.value)}>
            {Object.entries(ACTIVITY).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Goal */}
        <div className="mb-4">
          <label className="label">Goal</label>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(GOALS).map(([k, v]) => (
              <label key={k}
                className={`flex items-center gap-3 p-3 rounded-xl
                            border cursor-pointer transition-all
                  ${goal === k
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}>
                <input type="radio" name="goal" value={k}
                  checked={goal === k}
                  onChange={() => setGoal(k)}
                  className="accent-brand-500" />
                <span className={`text-sm font-medium ${goal === k
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-zinc-700 dark:text-zinc-300'
                  }`}>
                  {v.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Diet preference */}
        <div className="mb-5">
          <label className="label">Diet preference</label>
          <select className="input" value={dietType}
            onChange={e => setDietType(e.target.value)}>
            <option value="standard">Standard (Omnivore)</option>
            <option value="high_protein">High Protein</option>
            <option value="keto">Keto / Low Carb</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>

        <button onClick={calculate} className="btn-primary w-full">
          <Zap size={16} /> Calculate & Generate My Plan
        </button>
      </div>

      {/* Results */}
      {targets && plan && (
        <div className="space-y-4 animate-slide-up">

          {/* Targets breakdown */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Your calculated targets
              </h3>
              <div className="flex gap-2">
                <button onClick={saveGoals}
                  className={`btn-secondary text-xs flex items-center gap-1.5 ${saved ? 'text-green-600' : ''}`}>
                  {saved ? <><Check size={13} /> Saved</> : 'Save to goals'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                <p className="text-xs text-zinc-400 mb-1">BMR (at rest)</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {targets.bmr}
                </p>
                <p className="text-xs text-zinc-400">kcal/day</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                <p className="text-xs text-zinc-400 mb-1">Maintenance (TDEE)</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {targets.tdee}
                </p>
                <p className="text-xs text-zinc-400">kcal/day</p>
              </div>
            </div>

            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-brand-600
                             dark:text-brand-400 uppercase tracking-wide mb-3">
                Your target — {GOALS[goal].label}
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Calories', val: targets.calories, unit: 'kcal', color: 'text-brand-600 dark:text-brand-400' },
                  { label: 'Protein', val: targets.protein, unit: 'g', color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Carbs', val: targets.carbs, unit: 'g', color: 'text-green-600 dark:text-green-400' },
                  { label: 'Fat', val: targets.fat, unit: 'g', color: 'text-amber-600 dark:text-amber-400' },
                ].map(({ label, val, unit, color }) => (
                  <div key={label}>
                    <p className={`text-xl font-bold ${color}`}>
                      {val}<span className="text-xs font-normal">{unit}</span>
                    </p>
                    <p className="text-xs text-zinc-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Generated meal plan */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Your personalised meal plan
            </h3>
            <button onClick={regenerate}
              className="btn-ghost text-xs flex items-center gap-1.5">
              <RefreshCw size={13} /> Regenerate
            </button>
          </div>

          {/* Macro accuracy vs targets */}
          <MacroSummary targets={targets} actual={plan.totals} />

          {/* Meals */}
          <div className="space-y-3">
            {plan.meals.map((meal, i) => (
              <MealAccordion key={i} meal={meal} index={i} />
            ))}
          </div>

          {/* Log + save row */}
          {logMsg && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20
                            border border-green-100 dark:border-green-800
                            text-sm font-medium text-green-700 dark:text-green-400">
              {logMsg}
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Log this plan for today
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  All {plan.meals.reduce((s, m) => s + m.foods.length, 0)} items
                  added to your nutrition diary.
                </p>
              </div>
              <button onClick={logToday} disabled={logging}
                className="btn-primary flex-shrink-0">
                {logging ? 'Logging…' : <><Plus size={16} /> Log today</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function MealPlans() {
  const [tab, setTab] = useState('smart');
  const [selected, setSelected] = useState(null);
  const [logging, setLogging] = useState(false);
  const [logMsg, setLogMsg] = useState('');

  const logPlan = async plan => {
    setLogging(true); setLogMsg('');
    try {
      const today = new Date().toISOString().split('T')[0];
      for (const meal of plan.meals) {
        for (const food of meal.foods) {
          await api.post('/nutrition/logs', {
            food_name: food.name,
            meal_type: toMealType(meal.name),
            serving_size: 1,
            serving_unit: food.serving,
            calories: food.calories,
            protein_g: food.protein,
            carbs_g: food.carbs,
            fat_g: food.fat,
            log_date: today,
          });
        }
      }
      setLogMsg(`${plan.label} plan logged for today!`);
    } catch (e) { console.error(e); }
    finally {
      setLogging(false);
      setTimeout(() => setLogMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Meal Plans</h1>
        <p className="page-subtitle">
          Calculate your personal targets and get a custom meal plan,
          or choose a pre-built plan.
        </p>
      </div>

      {logMsg && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20
                        border border-green-100 dark:border-green-800
                        text-sm font-medium text-green-700 dark:text-green-400">
          {logMsg}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800
                      rounded-xl p-1 w-fit">
        {[
          { key: 'smart', label: 'Smart Plan (Personalised)' },
          { key: 'plans', label: 'Pre-built Plans' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === key
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
              }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Smart tab */}
      {tab === 'smart' && <SmartCalculator />}

      {/* Pre-built tab */}
      {tab === 'plans' && (
        <>
          {!selected ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PLAN_TEMPLATES.map(plan => (
                <button key={plan.key} onClick={() => setSelected(plan)}
                  className={`card p-5 text-left border-2 transition-all
                               hover:shadow-card-hover ${plan.color}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-white/60 dark:bg-black/20
                                    rounded-xl flex items-center justify-center">
                      <Apple size={20} className="text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <span className={`badge ${plan.badge}`}>
                      {plan.baseCalories} kcal
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    {plan.label}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400
                                leading-relaxed mb-4">
                    {plan.desc}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Protein', val: `${plan.baseProtein}g` },
                      { label: 'Carbs', val: `${plan.baseCarbs}g` },
                      { label: 'Fat', val: `${plan.baseFat}g` },
                    ].map(({ label, val }) => (
                      <div key={label}
                        className="bg-white/50 dark:bg-black/20 rounded-lg py-1.5">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {val}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelected(null)} className="btn-secondary text-sm">
                  ← All plans
                </button>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {selected.label} Plan
                </h2>
                <span className={`badge ${selected.badge} ml-auto`}>
                  {selected.baseCalories} kcal/day
                </span>
              </div>

              <div className="card p-5">
                <div className="grid grid-cols-4 gap-4 text-center">
                  {[
                    { label: 'Calories', val: selected.baseCalories, unit: 'kcal', color: 'text-brand-500' },
                    { label: 'Protein', val: selected.baseProtein, unit: 'g', color: 'text-blue-500' },
                    { label: 'Carbs', val: selected.baseCarbs, unit: 'g', color: 'text-green-500' },
                    { label: 'Fat', val: selected.baseFat, unit: 'g', color: 'text-amber-500' },
                  ].map(({ label, val, unit, color }) => (
                    <div key={label}>
                      <p className={`text-2xl font-bold ${color}`}>
                        {val}<span className="text-sm font-normal ml-0.5">{unit}</span>
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {selected.meals.map((meal, i) => (
                  <MealAccordion key={i} meal={meal} index={i} />
                ))}
              </div>

              <div className="card p-5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Log this plan for today
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      All {selected.meals.reduce((s, m) => s + m.foods.length, 0)} items
                      added to your nutrition diary.
                    </p>
                  </div>
                  <button onClick={() => logPlan(selected)} disabled={logging}
                    className="btn-primary flex-shrink-0">
                    {logging
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging...</>
                      : <><Plus size={16} /> Log today</>
                    }
                  </button>
                </div>

                {/* Inline success message — right below the button */}
                {logMsg && (
                  <div className="flex items-center gap-2 px-4 py-3
                                  rounded-xl bg-green-50 dark:bg-green-900/20
                                  border border-green-100 dark:border-green-800
                                  text-sm font-medium text-green-700
                                  dark:text-green-400 animate-slide-up">
                    <Check size={15} className="flex-shrink-0" />
                    {logMsg}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}