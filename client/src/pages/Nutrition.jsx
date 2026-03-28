import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Search, X, ChevronDown,
  Apple, Flame, Droplets, TrendingUp,
  Clock, Check,
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
} from 'chart.js';
import api from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_CONFIG = {
  breakfast: {
    label: 'Breakfast',
    icon: '🌅',
    color: 'from-orange-400 to-amber-500',
    light: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-500',
    dot: 'bg-orange-400',
  },
  lunch: {
    label: 'Lunch',
    icon: '☀️',
    color: 'from-green-400 to-emerald-500',
    light: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-500',
    dot: 'bg-green-400',
  },
  dinner: {
    label: 'Dinner',
    icon: '🌙',
    color: 'from-blue-400 to-indigo-500',
    light: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-500',
    dot: 'bg-blue-400',
  },
  snack: {
    label: 'Snack',
    icon: '🍎',
    color: 'from-purple-400 to-violet-500',
    light: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-500',
    dot: 'bg-purple-400',
  },
};

const CATEGORY_COLORS = {
  Protein: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Carbs: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Fats: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Dairy: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Vegetables: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Meals: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Snacks: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Drinks: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
};

// ── Animated number ───────────────────────────────────────────
function AnimNum({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current;
    const end = value;
    const diff = end - start;
    const steps = 20;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      setDisplay(Math.round(start + (diff * count / steps)));
      if (count >= steps) {
        setDisplay(end);
        prev.current = end;
        clearInterval(timer);
      }
    }, 400 / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span className="tabular-nums">{display}</span>;
}

// ── External tooltip handler ──────────────────────────────────
const externalTooltipHandler = (context) => {
  const { chart, tooltip } = context;
  let tooltipEl = document.getElementById('chartjs-tooltip');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-tooltip';
    tooltipEl.style.background = '#1a1a20';
    tooltipEl.style.borderRadius = '8px';
    tooltipEl.style.color = '#f1f5f9';
    tooltipEl.style.opacity = 1;
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.transform = 'translate(-50%, -100%)';
    tooltipEl.style.transition = 'all .15s ease';
    tooltipEl.style.zIndex = 9999;
    tooltipEl.style.padding = '8px 12px';
    tooltipEl.style.fontSize = '12px';
    tooltipEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    tooltipEl.style.whiteSpace = 'nowrap';
    document.body.appendChild(tooltipEl);
  }

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  // Set Text using the generated body lines
  if (tooltip.body) {
    const bodyLines = tooltip.body.map(b => b.lines);
    tooltipEl.innerHTML = bodyLines.map(line => `<div>${line}</div>`).join('');
  }

  // Measure absolutely bounding rect to avoid relative CSS caveats
  const canvasRect = chart.canvas.getBoundingClientRect();

  tooltipEl.style.opacity = 1;
  tooltipEl.style.left = canvasRect.left + window.pageXOffset + tooltip.caretX + 'px';
  tooltipEl.style.top = canvasRect.top + window.pageYOffset + tooltip.caretY - 10 + 'px';
};

// ── Macro donut chart ─────────────────────────────────────────
function MacroDonut({ protein, carbs, fat, calories, calGoal }) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  const empty = total === 0;

  const data = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{
      data: empty ? [1, 1, 1] : [
        Math.round(protein * 4),
        Math.round(carbs * 4),
        Math.round(fat * 9),
      ],
      backgroundColor: empty
        ? ['#f1f5f9', '#f1f5f9', '#f1f5f9']
        : ['#6366f1', '#10b981', '#f59e0b'],
      borderWidth: 0,
      hoverOffset: empty ? 0 : 5,
    }],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    layout: {
      padding: 10,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false, // Must be false to use external HTML tooltip
        external: empty ? undefined : externalTooltipHandler,
        position: 'nearest',
        callbacks: {
          label: ctx =>
            ` ${ctx.label}: ${ctx.parsed} kcal ` +
            `(${Math.round((ctx.parsed / total) * 100)}%)`,
        },
      },
    },
  };

  const calPct = calGoal > 0
    ? Math.min(100, Math.round((calories / calGoal) * 100)) : 0;

  return (
    <div className="relative h-36 w-36 mx-auto"
      style={{ overflow: 'visible' }}>
      <Doughnut data={data} options={opts} />
      <div className="absolute inset-0 flex flex-col items-center
                      justify-center pointer-events-none">
        {empty ? (
          <div className="flex flex-col items-center gap-0.5 px-3">
            <Apple size={14} className="text-zinc-300 dark:text-zinc-600" />
            <p className="text-2xs text-zinc-400 text-center leading-tight">
              Log food
            </p>
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold text-zinc-900
                           dark:text-zinc-100 tabular-nums leading-none">
              <AnimNum value={calories} />
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">kcal</p>
            <p className={`text-xs font-semibold mt-0.5 ${calPct >= 100 ? 'text-red-500' :
              calPct >= 85 ? 'text-amber-500' :
                'text-green-500'
              }`}>
              {calPct}% of goal
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Food search ───────────────────────────────────────────────
function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounce = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = val => {
    setQuery(val);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/nutrition/foods?q=${val}`);
        setResults(data);
        setOpen(true);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 280);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className={`relative transition-all duration-200 ${focused ? 'scale-[1.01]' : ''
        }`}>
        <Search size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2
                     text-zinc-400 pointer-events-none z-10" />
        <input
          className="input pl-10 pr-10 transition-all duration-200
                     focus:shadow-[0_0_0_3px_rgb(99_102_241_/_0.1)]"
          placeholder="Search 70+ foods — chicken, oats, banana..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => {
            setFocused(true);
            if (results.length) setOpen(true);
          }}
          onBlur={() => setFocused(false)}
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-brand-500
                            border-t-transparent rounded-full
                            animate-spin" />
          </div>
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2
                       text-zinc-400 hover:text-zinc-600
                       transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-40
                        bg-white dark:bg-[#141418]
                        border border-zinc-100 dark:border-zinc-800
                        rounded-2xl shadow-[0_8px_24px_0_rgb(0_0_0_/_0.12)]
                        overflow-hidden max-h-72
                        overflow-y-auto scrollbar-hide
                        animate-slide-up">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center">
              <Search size={20}
                className="mx-auto text-zinc-200
                           dark:text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-400">
                No foods found for "{query}"
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Try adding it manually below
              </p>
            </div>
          ) : (
            results.map((food, i) => (
              <button
                key={i}
                onClick={() => {
                  onSelect(food);
                  setQuery('');
                  setResults([]);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between
                           px-4 py-3 text-left
                           hover:bg-zinc-50 dark:hover:bg-zinc-800/60
                           transition-colors group
                           border-b border-zinc-50 dark:border-zinc-800/60
                           last:border-0"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-zinc-900
                                   dark:text-zinc-100 truncate">
                      {food.name}
                    </p>
                    <span className={`badge text-xs flex-shrink-0 ${CATEGORY_COLORS[food.category] ||
                      'bg-zinc-100 text-zinc-600'
                      }`}>
                      {food.category}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {food.serving}
                  </p>
                </div>
                <div className="flex items-center gap-3
                                flex-shrink-0 text-right">
                  <div>
                    <p className="text-sm font-bold text-zinc-800
                                   dark:text-zinc-200 tabular-nums">
                      {food.calories}
                    </p>
                    <p className="text-xs text-zinc-400">kcal</p>
                  </div>
                  <div className="hidden sm:block text-xs
                                  text-zinc-400 space-y-0.5">
                    <p>P <span className="text-brand-500 font-medium">
                      {food.protein}g
                    </span></p>
                    <p>C <span className="text-green-500 font-medium">
                      {food.carbs}g
                    </span></p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-zinc-100
                                  dark:bg-zinc-800 flex items-center
                                  justify-center opacity-0
                                  group-hover:opacity-100
                                  transition-all duration-150
                                  group-hover:bg-brand-50
                                  dark:group-hover:bg-brand-900/20">
                    <Plus size={13}
                      className="text-zinc-400
                                 group-hover:text-brand-500" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Quick add modal ───────────────────────────────────────────
function QuickAddModal({ food, onConfirm, onClose }) {
  const [meal, setMeal] = useState('breakfast');
  const [quantity, setQuantity] = useState(1);

  const scaled = {
    calories: Math.round(food.calories * quantity),
    protein_g: Math.round(food.protein * quantity * 10) / 10,
    carbs_g: Math.round(food.carbs * quantity * 10) / 10,
    fat_g: Math.round(food.fat * quantity * 10) / 10,
    fiber_g: Math.round((food.fiber || 0) * quantity * 10) / 10,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm
                    flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="card p-6 w-full max-w-sm animate-scale-in"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-zinc-900
                           dark:text-zinc-100">
              {food.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Per {food.serving}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        {/* Macro preview grid */}
        <div className="grid grid-cols-4 gap-2 mb-5 p-3
                        bg-zinc-50 dark:bg-zinc-800/60
                        rounded-xl">
          {[
            { label: 'Cal', val: scaled.calories, color: 'text-brand-500' },
            { label: 'Prot', val: `${scaled.protein_g}g`, color: 'text-blue-500' },
            { label: 'Carbs', val: `${scaled.carbs_g}g`, color: 'text-green-500' },
            { label: 'Fat', val: `${scaled.fat_g}g`, color: 'text-amber-500' },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={`text-sm font-bold ${color} tabular-nums`}>
                {val}
              </p>
              <p className="text-xs text-zinc-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label className="label">Servings</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(q => Math.max(0.5, q - 0.5))}
              className="w-9 h-9 rounded-xl bg-zinc-100
                         dark:bg-zinc-800 flex items-center
                         justify-center text-zinc-600
                         dark:text-zinc-400 hover:bg-zinc-200
                         dark:hover:bg-zinc-700 transition-colors
                         flex-shrink-0"
            >
              <X size={13} />
            </button>
            <input
              type="number" className="input text-center font-bold"
              min="0.5" step="0.5" value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
            />
            <button
              onClick={() => setQuantity(q => q + 0.5)}
              className="w-9 h-9 rounded-xl bg-zinc-100
                         dark:bg-zinc-800 flex items-center
                         justify-center text-zinc-600
                         dark:text-zinc-400 hover:bg-zinc-200
                         dark:hover:bg-zinc-700 transition-colors
                         flex-shrink-0"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Meal selector */}
        <div className="mb-5">
          <label className="label">Add to meal</label>
          <div className="grid grid-cols-4 gap-2">
            {MEALS.map(m => {
              const cfg = MEAL_CONFIG[m];
              return (
                <button
                  key={m}
                  onClick={() => setMeal(m)}
                  className={`py-2 rounded-xl text-xs font-medium
                              border transition-all duration-150
                              flex flex-col items-center gap-1
                    ${meal === m
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                >
                  <span className="text-base">{cfg.icon}</span>
                  <span className="capitalize text-xs">
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => onConfirm({
              food_name: food.name,
              meal_type: meal,
              serving_size: quantity,
              serving_unit: food.serving,
              ...scaled,
            })}
            className="btn-primary flex-1"
          >
            <Plus size={14} /> Add food
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Manual entry form ─────────────────────────────────────────
function ManualForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    food_name: '', meal_type: 'breakfast',
    serving_size: 1, serving_unit: 'serving',
    calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
  });

  const handleSubmit = async e => {
    e.preventDefault();
    await onAdd(form);
    setForm({
      food_name: '', meal_type: 'breakfast',
      serving_size: 1, serving_unit: 'serving',
      calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
    });
    setOpen(false);
  };

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-zinc-400
                   hover:text-zinc-600 dark:hover:text-zinc-300
                   transition-colors"
      >
        <ChevronDown size={13}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''
            }`} />
        Enter manually
      </button>

      {open && (
        <form onSubmit={handleSubmit}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3
                     mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/40
                     rounded-xl border border-zinc-100
                     dark:border-zinc-800 animate-slide-down">
          <div className="col-span-2">
            <label className="label">Food name</label>
            <input required className="input"
              placeholder="e.g. Chicken breast"
              value={form.food_name}
              onChange={e =>
                setForm(f => ({ ...f, food_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Meal</label>
            <select className="input" value={form.meal_type}
              onChange={e =>
                setForm(f => ({ ...f, meal_type: e.target.value }))
              }>
              {MEALS.map(m => (
                <option key={m} value={m} className="capitalize">
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Serving</label>
            <input type="number" className="input"
              min="0.1" step="0.1" value={form.serving_size}
              onChange={e =>
                setForm(f => ({ ...f, serving_size: e.target.value }))
              }
            />
          </div>
          {[
            { key: 'calories', label: 'Calories', step: '1' },
            { key: 'protein_g', label: 'Protein (g)', step: '0.1' },
            { key: 'carbs_g', label: 'Carbs (g)', step: '0.1' },
            { key: 'fat_g', label: 'Fat (g)', step: '0.1' },
          ].map(({ key, label, step }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input type="number" className="input"
                min="0" step={step} value={form[key]}
                onChange={e =>
                  setForm(f => ({ ...f, [key]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="col-span-2 sm:col-span-4
                          flex gap-2 justify-end">
            <button type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add food
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Food log item ─────────────────────────────────────────────
function FoodItem({ log, onDelete }) {
  const [removing, setRemoving] = useState(false);

  const handleDelete = async () => {
    setRemoving(true);
    await onDelete(log.id);
  };

  return (
    <div className={`flex items-center justify-between
                     px-4 py-3 group
                     border-b border-zinc-50 dark:border-zinc-800/60
                     last:border-0 hover:bg-zinc-50/50
                     dark:hover:bg-zinc-800/20
                     transition-all duration-200
                     ${removing ? 'opacity-0 scale-95' : 'opacity-100'}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-800
                       dark:text-zinc-200 truncate">
          {log.food_name}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">
          {log.serving_size} {log.serving_unit}
          {' · '}
          <span className="text-brand-500">
            P:{Math.round(log.protein_g)}g
          </span>
          {' '}
          <span className="text-green-500">
            C:{Math.round(log.carbs_g)}g
          </span>
          {' '}
          <span className="text-amber-500">
            F:{Math.round(log.fat_g)}g
          </span>
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <span className="text-sm font-bold text-zinc-700
                          dark:text-zinc-300 tabular-nums">
          {Math.round(log.calories)}
          <span className="text-xs font-normal text-zinc-400 ml-0.5">
            kcal
          </span>
        </span>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100
                     p-1.5 text-zinc-400 hover:text-red-500
                     hover:bg-red-50 dark:hover:bg-red-900/20
                     rounded-lg transition-all duration-150"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Meal section ──────────────────────────────────────────────
function MealSection({ meal, logs, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  const cfg = MEAL_CONFIG[meal];
  const mealCal = logs.reduce((s, l) => s + Number(l.calories), 0);
  const mealProt = logs.reduce((s, l) => s + Number(l.protein_g), 0);

  return (
    <div className="card overflow-hidden
                    hover:shadow-card-md transition-shadow duration-200">
      {/* Meal header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between
                   px-5 py-4 hover:bg-zinc-50/50
                   dark:hover:bg-zinc-800/20
                   transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {/* Icon with gradient */}
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br
                           ${cfg.color} flex items-center
                           justify-center flex-shrink-0
                           shadow-sm text-base`}>
            {cfg.icon}
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-900
                           dark:text-zinc-100">
              {cfg.label}
            </p>
            <p className="text-xs text-zinc-400">
              {logs.length > 0
                ? `${logs.length} item${logs.length > 1 ? 's' : ''} · ${Math.round(mealCal)} kcal`
                : 'Nothing logged yet'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {logs.length > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-zinc-600
                             dark:text-zinc-400 tabular-nums">
                {Math.round(mealCal)} kcal
              </p>
              <p className="text-xs text-blue-500 tabular-nums">
                {Math.round(mealProt)}g protein
              </p>
            </div>
          )}
          <ChevronDown size={16}
            className={`text-zinc-400 transition-transform duration-200
              ${collapsed ? '' : 'rotate-180'}`} />
        </div>
      </button>

      {/* Log items */}
      {!collapsed && (
        <div className="border-t border-zinc-50 dark:border-zinc-800/60
                        animate-slide-down">
          {logs.length === 0 ? (
            <div className="px-5 py-5 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${cfg.light}
                               flex items-center justify-center`}>
                <Apple size={14} className={cfg.text} />
              </div>
              <p className="text-sm text-zinc-400">
                Nothing logged for {cfg.label.toLowerCase()} yet
              </p>
            </div>
          ) : (
            <div>
              {logs.map(l => (
                <FoodItem key={l.id} log={l} onDelete={onDelete} />
              ))}
              {/* Meal total row */}
              <div className="flex items-center justify-between
                              px-4 py-2.5 bg-zinc-50/80
                              dark:bg-zinc-800/30
                              border-t border-zinc-50
                              dark:border-zinc-800/60">
                <span className="text-xs font-semibold text-zinc-500
                                  dark:text-zinc-400 uppercase
                                  tracking-wide">
                  Meal total
                </span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-brand-500 font-medium">
                    P:{Math.round(mealProt)}g
                  </span>
                  <span className="text-green-500 font-medium">
                    C:{Math.round(logs.reduce((s, l) => s + Number(l.carbs_g), 0))}g
                  </span>
                  <span className="text-amber-500 font-medium">
                    F:{Math.round(logs.reduce((s, l) => s + Number(l.fat_g), 0))}g
                  </span>
                  <span className="font-bold text-zinc-700
                                   dark:text-zinc-300 tabular-nums">
                    {Math.round(mealCal)} kcal
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function Nutrition() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [goals, setGoals] = useState({});
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [quickAdd, setQuickAdd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addedMsg, setAddedMsg] = useState('');

  useEffect(() => { fetchAll(); }, [date]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [l, s, g] = await Promise.all([
        api.get(`/nutrition/logs?date=${date}`),
        api.get(`/nutrition/summary?date=${date}`),
        api.get('/nutrition/goals'),
      ]);
      setLogs(l.data);
      setSummary(s.data);
      setGoals(g.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addLog = async logData => {
    try {
      await api.post('/nutrition/logs', {
        ...logData, log_date: date,
      });
      setAddedMsg(`${logData.food_name} added!`);
      setTimeout(() => setAddedMsg(''), 2500);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const deleteLog = async id => {
    try {
      await api.delete(`/nutrition/logs/${id}`);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const cal = Math.round(Number(summary.total_calories) || 0);
  const calGoal = goals.calories_goal || 2000;
  const calPct = Math.min(100, Math.round((cal / calGoal) * 100));
  const protein = Math.round(Number(summary.total_protein) || 0);
  const carbs = Math.round(Number(summary.total_carbs) || 0);
  const fat = Math.round(Number(summary.total_fat) || 0);

  const macros = [
    {
      label: 'Protein', val: protein,
      goal: goals.protein_goal || 150,
      color: 'bg-brand-500', text: 'text-brand-500', unit: 'g',
    },
    {
      label: 'Carbs', val: carbs,
      goal: goals.carbs_goal || 200,
      color: 'bg-green-500', text: 'text-green-500', unit: 'g',
    },
    {
      label: 'Fat', val: fat,
      goal: goals.fat_goal || 70,
      color: 'bg-amber-500', text: 'text-amber-500', unit: 'g',
    },
  ];

  const byMeal = MEALS.reduce((acc, m) => {
    acc[m] = logs.filter(l => l.meal_type === m);
    return acc;
  }, {});

  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Nutrition</h1>
          <p className="page-subtitle">
            {isToday ? "Today's" : 'Daily'} food intake and macros
          </p>
        </div>
        <input
          type="date"
          className="input w-auto text-sm cursor-pointer"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {/* ── Success toast ── */}
      {addedMsg && (
        <div className="flex items-center gap-2 px-4 py-3
                        rounded-xl bg-green-50 dark:bg-green-900/20
                        border border-green-100 dark:border-green-800
                        text-sm font-medium text-green-700
                        dark:text-green-400 animate-slide-up">
          <Check size={15} className="flex-shrink-0" />
          {addedMsg}
        </div>
      )}

      {/* ── Daily summary card ── */}
      <div className="card p-5">
        {loading ? (
          <div className="h-40 skeleton rounded-xl" />
        ) : (
          <div className="flex items-start gap-6">
            {/* Donut */}
            <div className="flex-shrink-0 hidden sm:block"
              style={{ overflow: 'visible' }}>
              <MacroDonut
                protein={Number(summary.total_protein) || 0}
                carbs={Number(summary.total_carbs) || 0}
                fat={Number(summary.total_fat) || 0}
                calories={cal}
                calGoal={calGoal}
              />
              {/* Legend */}
              <div className="flex justify-center gap-3 mt-3">
                {[
                  { label: 'P', color: 'bg-brand-500' },
                  { label: 'C', color: 'bg-green-500' },
                  { label: 'F', color: 'bg-amber-500' },
                ].map(({ label, color }) => (
                  <div key={label}
                    className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-xs text-zinc-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Macro bars */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-900
                               dark:text-zinc-100">
                  Today's Summary
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-zinc-900
                                   dark:text-zinc-100 tabular-nums">
                    <AnimNum value={cal} />
                  </span>
                  <span className="text-xs text-zinc-400">
                    / {calGoal} kcal
                  </span>
                </div>
              </div>

              {/* Calorie bar */}
              <div className="relative w-full bg-zinc-100
                              dark:bg-zinc-800 rounded-full h-3
                              mb-4 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all
                               duration-700 ease-out relative
                    ${calPct >= 100 ? 'bg-red-500' :
                      calPct >= 85 ? 'bg-amber-500' :
                        'bg-gradient-to-r from-brand-500 to-brand-400'
                    }`}
                  style={{ width: `${calPct}%` }}
                >
                  {/* Shimmer on bar */}
                  <div className="absolute inset-0 bg-gradient-to-r
                                  from-transparent via-white/25
                                  to-transparent
                                  animate-[shimmer_2s_ease-in-out_infinite]" />
                </div>
              </div>

              {/* Macro bars */}
              {macros.map(({ label, val, goal, color,
                text, unit }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-medium ${text}`}>
                      {label}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400
                                     tabular-nums">
                      <AnimNum value={val} />{unit}
                      <span className="text-zinc-300
                                       dark:text-zinc-600 mx-1">
                        /
                      </span>
                      {goal}{unit}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800
                                  rounded-full h-1.5 mb-2 overflow-hidden">
                    <div
                      className={`${color} h-1.5 rounded-full
                                   transition-all duration-700 ease-out`}
                      style={{
                        width: `${Math.min(100, (val / goal) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Add food section ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-brand-50 dark:bg-brand-900/20
                          rounded-lg flex items-center justify-center">
            <Plus size={14} className="text-brand-500" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100
                         text-sm">
            Add food
          </h3>
        </div>
        <FoodSearch onSelect={food => setQuickAdd(food)} />
        <ManualForm onAdd={addLog} />
      </div>

      {/* ── Meal sections ── */}
      <div className="space-y-3">
        {MEALS.map(meal => (
          <MealSection
            key={meal}
            meal={meal}
            logs={byMeal[meal]}
            onDelete={deleteLog}
          />
        ))}
      </div>

      {/* Quick add modal */}
      {quickAdd && (
        <QuickAddModal
          food={quickAdd}
          onClose={() => setQuickAdd(null)}
          onConfirm={async logData => {
            await addLog(logData);
            setQuickAdd(null);
          }}
        />
      )}
    </div>
  );
}