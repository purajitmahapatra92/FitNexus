import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Dumbbell, Apple, CheckSquare,
  Trophy, ChevronRight, Droplets, TrendingUp,
  Calendar, Play, Zap,
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Filler,
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Filler
);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function Skel({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

function AnimatedValue({ value, suffix = '', loading }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (loading || value === 0) return;
    const start = prev.current;
    const end = Number(value);
    const duration = 800;
    const steps = 30;
    const inc = (end - start) / steps;
    let current = start;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      current += inc;
      if (count >= steps) {
        setDisplay(end);
        prev.current = end;
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, loading]);

  if (loading) return <Skel className="h-8 w-20 mt-1 rounded-md" />;
  return <span className="tabular-nums font-bold tracking-tight">{display}{suffix}</span>;
}

function StatCard({ label, value, suffix = '', icon: Icon, color, bg, sub, subColor, extra, loading, gradient }) {
  return (
    <div className="card group p-6 flex flex-col justify-between min-h-[140px] relative overflow-hidden group-hover:-translate-y-1 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] transition-all duration-300">
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none`} />

      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm`}>
          <Icon size={18} className={color} />
        </div>
        {extra && <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-300">{extra}</div>}
      </div>

      <div className="mt-4">
        {loading ? (
          <>
            <Skel className="h-8 w-20 mb-2 rounded-md" />
            <Skel className="h-3 w-24 rounded-sm" />
          </>
        ) : (
          <>
            <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-none tracking-tight">
              <AnimatedValue value={value} suffix={suffix} loading={loading} />
            </p>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-2">{label}</p>
            {sub && <p className={`text-[11px] font-medium mt-1 ${subColor} tracking-wide`}>{sub}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function WaterRing({ pct }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width="44" height="44" className="-rotate-90 drop-shadow-sm">
      <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-blue-100 dark:stroke-blue-500/10" />
      <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" stroke="#3b82f6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
    </svg>
  );
}

function SectionHeader({ title, linkLabel, onClick }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-wide uppercase">{title}</h3>
      {onClick && (
        <button onClick={onClick} className="group flex items-center gap-1 text-[11px] font-bold text-brand-500 hover:text-brand-600 uppercase tracking-wider transition-colors">
          {linkLabel}
          <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm group hover:scale-105 transition-transform duration-300">
        <Icon size={28} className="text-zinc-400 dark:text-zinc-500 group-hover:text-brand-500 transition-colors" />
      </div>
      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">{title}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 max-w-[200px]">{desc}</p>
      {action && (
        <button onClick={onAction} className="btn-primary text-xs px-5 py-2.5">
          {action}
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dark = document.documentElement.classList.contains('dark');

  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [nutrition, setNutrition] = useState({});
  const [habits, setHabits] = useState({});
  const [weekNut, setWeekNut] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [water, setWater] = useState({ total_ml: 0, goal_ml: 2500 });

  useEffect(() => {
    Promise.allSettled([
      api.get('/workouts/sessions/all').then(r => setSessions(r.data.slice(0, 5))),
      api.get('/nutrition/summary').then(r => setNutrition(r.data)),
      api.get('/habits/summary/today').then(r => setHabits(r.data)),
      api.get('/nutrition/weekly').then(r => setWeekNut(r.data)),
      api.get('/achievements/recent').then(r => setAchievements(r.data)),
      api.get('/profile/streak').then(r => setStreak(r.data.streak_count || 0)),
      api.get('/habits/water/today').then(r => setWater(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const cal = Math.round(Number(nutrition.total_calories) || 0);
  const habitPct = Number(habits.total_habits) > 0 ? Math.round((Number(habits.completed_today) / Number(habits.total_habits)) * 100) : 0;
  const waterPct = Math.round((water.total_ml / water.goal_ml) * 100);
  const waterL = (water.total_ml / 1000).toFixed(1);
  const goalL = (water.goal_ml / 1000).toFixed(1);

  const gridColor = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const tickColor = dark ? '#71717a' : '#a1a1aa';

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: dark ? '#18181b' : '#ffffff',
        titleColor: dark ? '#f4f4f5' : '#18181b',
        bodyColor: dark ? '#a1a1aa' : '#52525b',
        borderColor: dark ? '#27272a' : '#e4e4e7',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        grid: { color: gridColor, display: false },
        ticks: { color: tickColor, font: { size: 11, family: "'Inter', sans-serif" } },
      },
      y: {
        grid: { color: gridColor, borderDash: [4, 4] },
        ticks: { color: tickColor, font: { size: 11, family: "'Inter', sans-serif" } },
        beginAtZero: true,
      },
    },
  };

  const weekLabels = weekNut.map(d => new Date(d.log_date).toLocaleDateString('en', { weekday: 'short' }));

  const calorieData = {
    labels: weekLabels,
    datasets: [{
      data: weekNut.map(d => Number(d.total_calories) || 0),
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, dark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)');
        gradient.addColorStop(1, 'rgba(99,102,241,0.0)');
        return gradient;
      },
      borderColor: '#6366f1',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#6366f1',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const macroData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{
      data: [
        Math.round(Number(nutrition.total_protein) || 0),
        Math.round(Number(nutrition.total_carbs) || 0),
        Math.round(Number(nutrition.total_fat) || 0),
      ],
      backgroundColor: [
        'rgba(99,102,241,0.9)',
        'rgba(16,185,129,0.9)',
        'rgba(245,158,11,0.9)',
      ],
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 24,
    }],
  };

  const stats = [
    {
      label: 'Workout Streak',
      value: streak,
      suffix: ' days',
      icon: Flame,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      gradient: 'bg-amber-500/10 dark:bg-amber-500/20',
      sub: streak > 0 ? 'Keep it up!' : 'Start today',
      subColor: streak > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-400',
    },
    {
      label: 'Calories Today',
      value: cal,
      icon: Apple,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      gradient: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      sub: 'kcal logged',
      subColor: 'text-emerald-500 dark:text-emerald-400',
    },
    {
      label: 'Water Today',
      value: Number((water.total_ml / 1000).toFixed(1)),
      suffix: 'L',
      icon: Droplets,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      gradient: 'bg-blue-500/10 dark:bg-blue-500/20',
      sub: `${waterL}L of ${goalL}L goal`,
      subColor: waterPct >= 100 ? 'text-emerald-500 dark:text-emerald-400' : 'text-blue-500 dark:text-blue-400',
      extra: <WaterRing pct={waterPct} />,
    },
    {
      label: 'Habits Done',
      value: habitPct,
      suffix: '%',
      icon: CheckSquare,
      color: 'text-brand-500',
      bg: 'bg-brand-50 dark:bg-brand-500/10',
      gradient: 'bg-brand-500/10 dark:bg-brand-500/20',
      sub: `${habits.completed_today || 0} of ${habits.total_habits || 0}`,
      subColor: 'text-brand-500 dark:text-brand-400',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
            Good {getGreeting()},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-300">
              {user?.name?.split(' ')[0]}
            </span>{' '}
            <span className="inline-block hover:scale-110 origin-bottom right transition-transform duration-300">👋</span>
          </h1>
          <p className="text-base font-medium text-zinc-500 dark:text-zinc-400 mt-2 tracking-wide">
            {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl card text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
            <span className="text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">All systems running</span>
          </div>
          <button
            onClick={() => navigate('/workouts')}
            className="group flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold shadow-[0_4px_12px_rgba(99,102,241,0.4),inner_0_1px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(99,102,241,0.5),inner_0_1px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            <Play size={14} className="fill-white group-hover:scale-110 transition-transform duration-200" />
            Start workout
          </button>
        </div>
      </div>

      {/* ── Stat cards Bento Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((s, i) => (
          <div key={s.label} className={`animate-slide-up stagger-${(i % 4) + 1}`}>
            <StatCard {...s} loading={loading} />
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up stagger-3">
        {/* Weekly calories */}
        <div className="card p-6 lg:col-span-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-300">
          <SectionHeader title="Weekly Calories" linkLabel="Nutrition" onClick={() => navigate('/nutrition')} />
          <div className="h-[240px] w-full">
            {loading ? (
              <Skel className="h-full rounded-lg" />
            ) : weekNut.length > 0 ? (
              <Line data={calorieData} options={chartOpts} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center group">
                  <TrendingUp size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3 group-hover:scale-110 group-hover:text-brand-500 transition-all duration-300" />
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Log meals to see trends</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Today's macros */}
        <div className="card p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-300">
          <SectionHeader title="Today's Macros" />
          {loading ? (
            <Skel className="h-40 mb-6 rounded-lg" />
          ) : (
            <div className="h-40 relative">
              <Bar data={macroData} options={{ ...chartOpts, indexAxis: 'y' }} />
            </div>
          )}
          <div className="space-y-3 mt-6">
            {loading ? (
              [1, 2, 3].map(i => <Skel key={i} className="h-5 rounded-md" />)
            ) : (
              [
                { label: 'Protein', val: nutrition.total_protein, color: '#6366f1' },
                { label: 'Carbs', val: nutrition.total_carbs, color: '#10b981' },
                { label: 'Fat', val: nutrition.total_fat, color: '#f59e0b' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between text-[13px] px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <span className="flex items-center gap-2.5 font-semibold text-zinc-600 dark:text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {Math.round(Number(val) || 0)}<span className="text-[10px] text-zinc-500 ml-0.5">g</span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Dynamic Water progress ── */}
      <div className="card group overflow-hidden relative animate-slide-up stagger-4 p-0">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none group-hover:from-blue-500/20 transition-colors duration-500" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.3)] group-hover:scale-105 group-hover:rotate-6 transition-transform duration-300">
                <Droplets size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Water Intake</p>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 tracking-wide">{waterL}L of {goalL}L goal today</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className={`text-4xl font-black tabular-nums tracking-tighter ${waterPct >= 100 ? 'text-emerald-500' : 'text-blue-500'}`}>{waterPct}%</p>
              <button onClick={() => navigate('/habits')} className="text-xs font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mt-1 inline-flex items-center gap-1 group/btn">
                Log water <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full h-4 overflow-hidden shadow-inner flex items-center p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${waterPct >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
              style={{ width: `${Math.min(waterPct, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite]" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-5">
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: Math.min(Math.round(water.goal_ml / 250), 12) }).map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${i < Math.round(water.total_ml / 250) ? 'bg-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.3)] scale-100' : 'bg-zinc-100 dark:bg-zinc-800/60 scale-95 opacity-50'}`}>
                  <Droplets size={14} className={i < Math.round(water.total_ml / 250) ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'} />
                </div>
              ))}
            </div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex-shrink-0 ml-4 hidden sm:block">
              {Math.round(water.total_ml / 250)} / {Math.round(water.goal_ml / 250)} glasses
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up stagger-5">

        {/* Recent workouts */}
        <div className="card p-6 h-[340px] flex flex-col">
          <SectionHeader title="Recent Workouts" linkLabel="View history" onClick={() => navigate('/history')} />
          {loading ? (
            <div className="space-y-3 flex-1">
              {[1, 2, 3].map(i => <Skel key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide -mr-2 pr-2">
              {sessions.map((s, i) => (
                <div key={s.id} className="group flex items-center justify-between py-3 px-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all duration-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm hover:shadow-md animate-slide-up" style={{ animationDelay: `${i * 50}ms` }} onClick={() => navigate(`/history?id=${s.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-sm ${s.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
                      <Dumbbell size={18} className={s.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight tracking-tight group-hover:text-brand-500 transition-colors">
                        {s.workout_name || 'Workout'}
                      </p>
                      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
                        {new Date(s.started_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })} {s.duration_minutes ? `· ${s.duration_minutes}m` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`badge text-[10px] px-2.5 py-1 ${s.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={Dumbbell} title="No workouts yet" desc="Start your first session to track progress" action="Start workout" onAction={() => navigate('/workouts')} />
            </div>
          )}
        </div>

        {/* Recent achievements */}
        <div className="card p-6 h-[340px] flex flex-col">
          <SectionHeader title="Recent Achievements" linkLabel="View all" onClick={() => navigate('/achievements')} />
          {loading ? (
            <div className="space-y-3 flex-1">
              {[1, 2, 3].map(i => <Skel key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : achievements.length > 0 ? (
            <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide -mr-2 pr-2">
              {achievements.slice(0, 4).map((a, i) => (
                <div key={a.id} className="group flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-all duration-200 cursor-pointer border border-transparent hover:border-amber-200/50 dark:hover:border-amber-500/20 shadow-sm hover:shadow-md animate-slide-up" style={{ animationDelay: `${i * 50}ms` }} onClick={() => navigate('/achievements')}>
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.4)] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 relative">
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Trophy size={18} className="text-white drop-shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">{a.name}</p>
                    <p className="text-[11px] font-bold text-amber-500 dark:text-amber-400 mt-1 tracking-wider uppercase">
                      +{a.xp_awarded || a.xp_value} XP
                    </p>
                  </div>
                  <Zap size={16} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 drop-shadow-sm scale-75 group-hover:scale-100" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={Trophy} title="No achievements yet" desc="Complete workouts to earn your first badge" action="View achievements" onAction={() => navigate('/achievements')} />
            </div>
          )}
        </div>
      </div>

      {/* ── Quick nav strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
        {[
          { label: 'Log nutrition', icon: Apple, to: '/nutrition', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'View progress', icon: TrendingUp, to: '/progress', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
          { label: 'Check schedule', icon: Calendar, to: '/schedule', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
          { label: 'My habits', icon: CheckSquare, to: '/habits', color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-500/10' },
        ].map(({ label, icon: Icon, to, color, bg }) => (
          <button key={label} onClick={() => navigate(to)} className="group card p-4 sm:p-5 flex items-center gap-3 hover:shadow-lg hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 text-left">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm`}>
              <Icon size={18} className={color} />
            </div>
            <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}