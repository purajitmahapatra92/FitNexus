import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, CheckSquare, Flame,
  Droplets, RotateCcw, Check, Trophy,
  Zap, X,
} from 'lucide-react';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const DAYS      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const today     = new Date();
const todayStr  = today.toISOString().split('T')[0];

// ── Streak badge ──────────────────────────────────────────────
function StreakBadge({ streak }) {
  if (streak === 0) return null;

  const isMilestone = [7,14,21,30,60,100].includes(streak);

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5
                     rounded-full text-xs font-bold
                     transition-all duration-300
      ${isMilestone
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm'
        : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
      }`}>
      <Flame size={11}
        className={isMilestone ? 'animate-pulse-soft' : ''} />
      {streak}
      {isMilestone && (
        <span className="ml-0.5">🎉</span>
      )}
    </div>
  );
}

// ── Water tracker ─────────────────────────────────────────────
function WaterTracker() {
  const [water,       setWater]       = useState({ total_ml:0, goal_ml:2500 });
  const [loading,     setLoading]     = useState(false);
  const [added,       setAdded]       = useState(false);
  const [customOpen,  setCustomOpen]  = useState(false);
  const [customVal,   setCustomVal]   = useState('');
  const customInputRef = useRef(null);

  useEffect(() => { fetchWater(); }, []);

  const fetchWater = async () => {
    try {
      const { data } = await api.get('/habits/water/today');
      setWater(data);
    } catch(e) { console.error(e); }
  };

  const addWater = async ml => {
    setLoading(true);
    try {
      const { data } = await api.post('/habits/water/add',
        { amount_ml: ml }
      );
      setWater(data);
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetWater = async () => {
    try {
      await api.delete('/habits/water/reset');
      setWater(w => ({ ...w, total_ml:0 }));
    } catch(e) { console.error(e); }
  };

  const handleCustomOpen = () => {
    setCustomOpen(true);
    setCustomVal('');
    // Focus the input after it renders
    setTimeout(() => customInputRef.current?.focus(), 50);
  };

  const handleCustomSubmit = () => {
    const ml = Number(customVal);
    if (!customVal || isNaN(ml) || ml <= 0) return;
    addWater(ml);
    setCustomVal('');
    setCustomOpen(false);
  };

  const handleCustomKeyDown = e => {
    if (e.key === 'Enter') handleCustomSubmit();
    if (e.key === 'Escape') {
      setCustomOpen(false);
      setCustomVal('');
    }
  };

  const pct           = Math.min(100,
    Math.round((water.total_ml / water.goal_ml) * 100)
  );
  const glasses       = Math.round(water.total_ml / 250);
  const goalGlasses   = Math.round(water.goal_ml  / 250);
  const r             = 52;
  const circumference = 2 * Math.PI * r;
  const offset        = circumference * (1 - pct / 100);
  const QUICK_ADD     = [150, 250, 350, 500];

  return (
    <div className="card p-6 overflow-hidden relative group animate-slide-up stagger-1">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br
                      from-blue-50/60 to-transparent
                      dark:from-blue-900/10 dark:to-transparent
                      pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30
                            rounded-lg flex items-center justify-center">
              <Droplets size={15} className="text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900
                             dark:text-zinc-100 text-sm">
                Water Intake
              </h3>
              <p className="text-xs text-zinc-400">
                Daily hydration tracking
              </p>
            </div>
          </div>
          <button
            onClick={resetWater}
            className="btn-ghost p-1.5 text-zinc-400
                       hover:text-blue-500 transition-colors"
            title="Reset today's water"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <svg width="128" height="128" className="-rotate-90">
              <circle cx="64" cy="64" r={r}
                fill="none" strokeWidth="10"
                className="stroke-blue-100 dark:stroke-blue-900/30" />
              <circle cx="64" cy="64" r={r}
                fill="none" strokeWidth="10"
                stroke={pct >= 100 ? '#22c55e' : '#3b82f6'}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                  transition:'stroke-dashoffset 0.8s ease, stroke 0.5s ease',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col
                            items-center justify-center">
              <p className={`text-2xl font-bold tabular-nums
                             leading-none transition-colors duration-500
                ${pct >= 100 ? 'text-green-500' : 'text-blue-500'}`}>
                {(water.total_ml / 1000).toFixed(1)}L
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                of {(water.goal_ml / 1000).toFixed(1)}L
              </p>
              <p className={`text-xs font-bold mt-0.5
                ${pct >= 100 ? 'text-green-500' : 'text-blue-400'}`}>
                {pct}%
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Glass grid */}
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                {glasses} / {goalGlasses} glasses
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: goalGlasses }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => i >= glasses && addWater(250)}
                    className={`w-7 h-7 rounded-lg flex items-center
                                 justify-center transition-all duration-200
                      ${i < glasses
                        ? 'bg-blue-500 shadow-sm scale-100 cursor-default'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-110 cursor-pointer'
                      }`}
                    title={i >= glasses ? '+250ml' : 'Done'}
                  >
                    <Droplets size={12} className={
                      i < glasses
                        ? 'text-white'
                        : 'text-zinc-300 dark:text-zinc-600'
                    } />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick add + custom */}
            <div>
              <p className="text-xs text-zinc-400 mb-2">Quick add</p>
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_ADD.map(ml => (
                  <button
                    key={ml}
                    onClick={() => addWater(ml)}
                    disabled={loading}
                    className="px-2.5 py-1.5 rounded-lg text-xs
                               font-semibold border transition-all
                               duration-150 disabled:opacity-50
                               border-blue-200 dark:border-blue-800
                               text-blue-600 dark:text-blue-400
                               bg-blue-50 dark:bg-blue-900/20
                               hover:bg-blue-100 dark:hover:bg-blue-900/30
                               hover:-translate-y-0.5 active:translate-y-0"
                  >
                    +{ml >= 1000 ? `${ml/1000}L` : `${ml}ml`}
                  </button>
                ))}

                {/* Custom button — toggles inline input */}
                {!customOpen && (
                  <button
                    onClick={handleCustomOpen}
                    className="px-2.5 py-1.5 rounded-lg text-xs
                               font-medium border border-dashed
                               border-zinc-300 dark:border-zinc-600
                               text-zinc-500 dark:text-zinc-400
                               hover:border-blue-400
                               dark:hover:border-blue-600
                               hover:text-blue-500
                               dark:hover:text-blue-400
                               hover:bg-blue-50
                               dark:hover:bg-blue-900/10
                               transition-all duration-150"
                  >
                    + Custom
                  </button>
                )}
              </div>

              {/* Inline custom input — animates in below buttons */}
              {customOpen && (
                <div className="flex items-center gap-2 mt-2.5
                                animate-slide-down">
                  <div className="relative flex-1">
                    <input
                      ref={customInputRef}
                      type="number"
                      min="1"
                      max="2000"
                      step="50"
                      className="input pr-10 text-sm py-1.5
                                 focus:shadow-[0_0_0_3px_rgb(59_130_246_/_0.15)]"
                      placeholder="Amount in ml..."
                      value={customVal}
                      onChange={e => setCustomVal(e.target.value)}
                      onKeyDown={handleCustomKeyDown}
                    />
                    <span className="absolute right-3 top-1/2
                                     -translate-y-1/2 text-xs
                                     text-zinc-400 pointer-events-none">
                      ml
                    </span>
                  </div>
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customVal || Number(customVal) <= 0}
                    className="flex items-center gap-1 px-3 py-1.5
                               rounded-xl text-xs font-semibold
                               bg-blue-500 hover:bg-blue-600
                               disabled:opacity-40
                               disabled:cursor-not-allowed
                               text-white transition-all duration-150
                               hover:-translate-y-0.5
                               active:translate-y-0 flex-shrink-0"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setCustomOpen(false);
                      setCustomVal('');
                    }}
                    className="p-1.5 rounded-lg text-zinc-400
                               hover:text-zinc-600 dark:hover:text-zinc-300
                               hover:bg-zinc-100 dark:hover:bg-zinc-800
                               transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goal reached banner */}
        {pct >= 100 && (
          <div className="mt-4 p-3 rounded-xl bg-green-50
                          dark:bg-green-900/20 border border-green-100
                          dark:border-green-800 flex items-center
                          gap-2 animate-slide-up">
            <div className="w-6 h-6 bg-green-500 rounded-full
                            flex items-center justify-center
                            flex-shrink-0">
              <Check size={13} className="text-white" />
            </div>
            <p className="text-xs font-semibold text-green-700
                           dark:text-green-400">
              Daily water goal reached! Well done 💧
            </p>
          </div>
        )}

        {/* Added confirmation */}
        {added && (
          <div className="absolute top-0 right-0 px-3 py-1.5
                          bg-blue-500 text-white text-xs font-semibold
                          rounded-xl animate-slide-down shadow-sm">
            +water logged!
          </div>
        )}
      </div>
    </div>
  );
}

// ── Habit card ────────────────────────────────────────────────
function HabitCard({ habit, weekData, onToggle, onDelete }) {
  const [pressing,  setPressing]  = useState(false);

  const last7 = Array.from({ length:7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6 + i);
    return d.toISOString().split('T')[0];
  });

  const weekLogs = weekData.find(w => w.id === habit.id)
    ?.week_logs || [];

  const completedThisWeek = last7.filter(date => {
    return weekLogs.some(l =>
      new Date(l.date).toISOString().split('T')[0] === date &&
      l.completed
    );
  }).length;

  const handleToggle = async () => {
    setPressing(true);
    await onToggle(habit.id);
    setTimeout(() => setPressing(false), 400);
  };

  return (
    <div className={`card p-5 transition-all duration-300
                     hover:shadow-card-md group relative
                     overflow-hidden animate-slide-up stagger-2
      ${habit.completed_today
        ? 'border-green-200 dark:border-green-800/60'
        : ''
      }`}>

      {/* Completion glow */}
      {habit.completed_today && (
        <div className="absolute inset-0 bg-gradient-to-r
                        from-green-50/40 to-transparent
                        dark:from-green-900/10 dark:to-transparent
                        pointer-events-none" />
      )}

      <div className="relative">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Complete button */}
            <button
              onClick={handleToggle}
              className={`relative w-11 h-11 rounded-2xl flex items-center
                          justify-center text-lg transition-all duration-300
                          flex-shrink-0 select-none
                ${pressing ? 'scale-90' : 'scale-100'}
                ${habit.completed_today
                  ? 'shadow-[0_2px_8px_0_rgb(34_197_94_/_0.35)]'
                  : 'border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-105'
                }`}
              style={habit.completed_today
                ? { backgroundColor: habit.color }
                : {}
              }
            >
              {habit.completed_today ? (
                <Check size={18} className="text-white" />
              ) : (
                <span className="text-xl">{habit.icon}</span>
              )}
              {/* Ripple on press */}
              {pressing && (
                <span className="absolute inset-0 rounded-2xl
                                 animate-ping opacity-30"
                  style={{ backgroundColor: habit.color || '#6366f1' }}
                />
              )}
            </button>

            {/* Name + meta */}
            <div className="min-w-0">
              <p className={`font-semibold text-sm transition-all
                              duration-300
                ${habit.completed_today
                  ? 'line-through text-zinc-400'
                  : 'text-zinc-900 dark:text-zinc-100'
                }`}>
                {habit.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-zinc-400">
                  {completedThisWeek}/7 this week
                </p>
                {completedThisWeek >= 5 && (
                  <Zap size={10}
                    className="text-amber-400" />
                )}
              </div>
            </div>
          </div>

          {/* Right side — streak + delete */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <StreakBadge
              streak={habit.completed_today
                ? habit.completions_this_week || 0
                : 0
              }
            />
            <button
              onClick={() => onDelete(habit.id)}
              className="opacity-0 group-hover:opacity-100
                         p-1.5 text-zinc-400 hover:text-red-500
                         hover:bg-red-50 dark:hover:bg-red-900/20
                         rounded-lg transition-all duration-150"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* 7-day strip */}
        <div className="flex gap-1">
          {last7.map((date, di) => {
            const log = weekLogs.find(l =>
              new Date(l.date).toISOString().split('T')[0] === date
            );
            const done     = log?.completed;
            const isToday  = date === todayStr;
            const dayIdx   = new Date(date).getDay();

            return (
              <div key={date}
                className="flex-1 flex flex-col items-center gap-1.5">
                <span className={`text-2xs font-medium transition-colors
                  ${isToday
                    ? 'text-brand-500 font-bold'
                    : 'text-zinc-400'
                  }`}>
                  {DAYS[dayIdx]}
                </span>
                <div
                  className={`w-full h-6 rounded-lg transition-all
                               duration-300 flex items-center
                               justify-center
                    ${done
                      ? 'shadow-sm'
                      : isToday
                        ? 'bg-zinc-100 dark:bg-zinc-800 ring-1 ring-brand-300 dark:ring-brand-700'
                        : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  style={done
                    ? { backgroundColor: habit.color }
                    : {}
                  }
                >
                  {done && (
                    <Check size={11} className="text-white" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Habits page ──────────────────────────────────────────
export default function Habits() {
  const { notify }     = useNotifications();
  const [habits,   setHabits]   = useState([]);
  const [summary,  setSummary]  = useState({});
  const [weekData, setWeekData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [form, setForm] = useState({
    name:'', icon:'🎯', color:'#6366f1', target_days:7,
  });

  const PRESET_COLORS = [
    '#6366f1','#10b981','#f59e0b','#ef4444',
    '#8b5cf6','#06b6d4','#f97316','#ec4899',
  ];
  const PRESET_ICONS = [
    '🎯','💪','🏃','🧘','📚','💧','🥗','😴',
    '🎸','✍️','🌿','🏋️',
  ];

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [h, s, w] = await Promise.all([
        api.get('/habits'),
        api.get('/habits/summary/today'),
        api.get('/habits/summary/week'),
      ]);
      setHabits(h.data);
      setSummary(s.data);
      setWeekData(w.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createHabit = async e => {
    e.preventDefault();
    try {
      await api.post('/habits', form);
      setShowForm(false);
      setForm({ name:'', icon:'🎯', color:'#6366f1', target_days:7 });
      fetchAll();
    } catch(e) { console.error(e); }
  };

  const toggleHabit = async id => {
    try {
      const res = await api.post(`/habits/${id}/complete`, {});
      if (res.data.completed) {
        const streakRes = await api.get(`/habits/${id}/streak`);
        const streak    = streakRes.data.streak;
        if ([7,14,30,60,100].includes(streak)) {
          notify({
            title:   `${streak} Day Streak! 🔥`,
            message: `${habits.find(h=>h.id===id)?.name} — incredible consistency!`,
            type:    'success',
          });
        }
      }
      fetchAll();
    } catch(e) { console.error(e); }
  };

  const deleteHabit = async id => {
    try {
      await api.delete(`/habits/${id}`);
      fetchAll();
    } catch(e) { console.error(e); }
  };

  const total     = Number(summary.total_habits)    || 0;
  const completed = Number(summary.completed_today) || 0;
  const pct       = total > 0
    ? Math.round((completed / total) * 100) : 0;
  const allDone   = total > 0 && completed === total;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Habits</h1>
          <p className="page-subtitle">
            Build consistency one day at a time.
          </p>
        </div>
        <button onClick={() => setShowForm(s=>!s)}
          className="btn-primary">
          <Plus size={16} /> New habit
        </button>
      </div>

      {/* ── Water tracker ── */}
      <WaterTracker />

      {/* ── Today's progress card ── */}
      <div className={`card p-5 transition-all duration-500
        ${allDone
          ? 'border-green-200 dark:border-green-800/60'
          : ''
        }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {allDone ? (
              <div className="w-8 h-8 bg-green-500 rounded-xl
                              flex items-center justify-center
                              shadow-sm">
                <Trophy size={15} className="text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-orange-50
                              dark:bg-orange-900/20 rounded-xl
                              flex items-center justify-center">
                <Flame size={15} className="text-orange-500" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-zinc-900
                             dark:text-zinc-100">
                {allDone ? 'All habits done! 🎉' : "Today's Habits"}
              </p>
              <p className="text-xs text-zinc-400">
                {completed} of {total} completed
              </p>
            </div>
          </div>
          <span className={`text-2xl font-bold tabular-nums
            ${allDone ? 'text-green-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
            {pct}%
          </span>
        </div>

        {/* Segmented progress bar */}
        <div className="flex gap-0.5">
          {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-all
                           duration-500
                ${i < completed
                  ? allDone
                    ? 'bg-green-500'
                    : 'bg-brand-500'
                  : 'bg-zinc-100 dark:bg-zinc-800'
                }`}
              style={{ transitionDelay:`${i * 50}ms` }}
            />
          ))}
        </div>
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <div className="card p-5 animate-slide-down
                        border-brand-100 dark:border-brand-900/40">
          <h3 className="font-semibold text-zinc-900
                         dark:text-zinc-100 mb-4">
            New habit
          </h3>
          <form onSubmit={createHabit} className="space-y-4">
            <div>
              <label className="label">Habit name</label>
              <input required className="input"
                placeholder="e.g. Drink 8 glasses of water"
                value={form.name}
                onChange={e =>
                  setForm(f => ({...f, name:e.target.value}))
                }
              />
            </div>

            {/* Icon picker */}
            <div>
              <label className="label">Icon</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map(icon => (
                  <button
                    key={icon} type="button"
                    onClick={() => setForm(f => ({...f, icon}))}
                    className={`w-10 h-10 rounded-xl text-xl
                                flex items-center justify-center
                                border-2 transition-all duration-150
                      ${form.icon === icon
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-110'
                        : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:scale-105'
                      }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="label">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color} type="button"
                    onClick={() => setForm(f => ({...f, color}))}
                    className={`w-8 h-8 rounded-xl transition-all
                                duration-150 flex-shrink-0
                      ${form.color === color
                        ? 'scale-125 ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-600'
                        : 'hover:scale-110'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary">
                Cancel
              </button>
              <button type="submit"
                className="btn-primary">
                Create habit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Habit list ── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card h-28 skeleton" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800
                          rounded-2xl flex items-center justify-center
                          mx-auto mb-4">
            <CheckSquare size={28}
              className="text-zinc-300 dark:text-zinc-600" />
          </div>
          <p className="font-semibold text-zinc-600
                         dark:text-zinc-400 mb-1">
            No habits yet
          </p>
          <p className="text-sm text-zinc-400 mb-5">
            Create your first habit to start building streaks
          </p>
          <button onClick={() => setShowForm(true)}
            className="btn-primary mx-auto">
            <Plus size={15} /> Add your first habit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending first, completed at bottom */}
          {[
            ...habits.filter(h => !h.completed_today),
            ...habits.filter(h =>  h.completed_today),
          ].map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              weekData={weekData}
              onToggle={toggleHabit}
              onDelete={deleteHabit}
            />
          ))}
        </div>
      )}
    </div>
  );
}