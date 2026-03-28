import { useState, useEffect, useRef } from 'react';
import { Trophy, Star, Zap, Lock, Check } from 'lucide-react';
import api from '../services/api';

const CATEGORY_META = {
  workout:   {
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    glow:  'rgba(59,130,246,0.15)',
    from:  'from-blue-400', to: 'to-blue-600',
  },
  streak:    {
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    glow:  'rgba(249,115,22,0.15)',
    from:  'from-orange-400', to: 'to-orange-600',
  },
  strength:  {
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    glow:  'rgba(139,92,246,0.15)',
    from:  'from-purple-400', to: 'to-purple-600',
  },
  nutrition: {
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    glow:  'rgba(16,185,129,0.15)',
    from:  'from-green-400', to: 'to-green-600',
  },
  habit:     {
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    glow:  'rgba(20,184,166,0.15)',
    from:  'from-teal-400', to: 'to-teal-600',
  },
  progress:  {
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    glow:  'rgba(236,72,153,0.15)',
    from:  'from-pink-400', to: 'to-pink-600',
  },
  general:   {
    color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    glow:  'rgba(107,114,128,0.15)',
    from:  'from-zinc-400', to: 'to-zinc-600',
  },
};

// ── Scroll reveal hook ────────────────────────────────────────
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el  = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── XP level bar ──────────────────────────────────────────────
function XPCard({ xp, earned, total }) {
  const [ref, visible] = useReveal(0.2);
  const level    = xp.level       || 1;
  const totalXP  = xp.total_xp    || 0;
  const progress = xp.xp_progress || 0;
  const needed   = xp.xp_needed   || 100;
  const pct      = Math.min(100, Math.round((progress / needed) * 100));

  return (
    <div
      ref={ref}
      className={`card p-5 overflow-hidden relative
                  transition-all duration-700
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-48 h-48
                      rounded-full bg-amber-400/10 blur-3xl
                      pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          {/* Level badge */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br
                              from-amber-400 to-amber-600
                              rounded-2xl flex items-center
                              justify-center
                              shadow-[0_4px_14px_0_rgb(245_158_11_/_0.4)]">
                <Star size={28} className="text-white" />
              </div>
              {/* Level number bubble */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6
                              bg-brand-500 rounded-full flex items-center
                              justify-center border-2 border-white
                              dark:border-zinc-900">
                <span className="text-2xs font-bold text-white">
                  {level}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400
                             uppercase tracking-widest mb-0.5">
                Current level
              </p>
              <p className="text-3xl font-bold text-zinc-900
                             dark:text-zinc-100 leading-none">
                Level {level}
              </p>
              <p className="text-xs text-amber-500 font-semibold mt-0.5">
                {totalXP.toLocaleString()} total XP
              </p>
            </div>
          </div>

          {/* Earned count */}
          <div className="text-right">
            <div className="relative w-16 h-16 mx-auto">
              {/* Circular progress */}
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24"
                  fill="none" strokeWidth="4"
                  className="stroke-zinc-100 dark:stroke-zinc-800" />
                <circle cx="28" cy="28" r="24"
                  fill="none" strokeWidth="4"
                  stroke="#f59e0b"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - earned / Math.max(total, 1))}`}
                  style={{ transition:'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center
                              justify-center">
                <span className="text-sm font-bold text-zinc-900
                                  dark:text-zinc-100 tabular-nums leading-none">
                  {earned}
                </span>
                <span className="text-2xs text-zinc-400">
                  /{total}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-1 text-center">
              earned
            </p>
          </div>
        </div>

        {/* XP bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">
              Progress to Level {level + 1}
            </span>
            <span className="font-semibold text-amber-500 tabular-nums">
              {progress} / {needed} XP
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800
                          rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r
                         from-amber-400 to-amber-500
                         transition-all duration-1000 ease-out
                         relative overflow-hidden"
              style={{ width: visible ? `${pct}%` : '0%' }}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r
                              from-transparent via-white/30
                              to-transparent
                              animate-[shimmer_2s_ease-in-out_infinite]" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 text-right">
            {needed - progress} XP to next level
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Achievement card ──────────────────────────────────────────
function AchievementCard({ achievement: a, index }) {
  const [ref, visible] = useReveal(0.05);
  const meta = CATEGORY_META[a.category] || CATEGORY_META.general;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl border
                  transition-all duration-500 group
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        ${a.earned
          ? 'bg-white dark:bg-[#141418] border-zinc-100 dark:border-zinc-800/80 hover:shadow-card-md hover:-translate-y-0.5'
          : 'bg-zinc-50/80 dark:bg-[#111115] border-zinc-100/60 dark:border-zinc-800/40'
        }`}
      style={{ transitionDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      {/* Earned: colored top strip */}
      {a.earned && (
        <div className={`h-0.5 bg-gradient-to-r ${meta.from} ${meta.to}`} />
      )}

      {/* Locked: subtle pattern overlay */}
      {!a.earned && (
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)',
            backgroundSize: '8px 8px',
          }}
        />
      )}

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          {/* Trophy icon */}
          <div className="relative">
            {a.earned ? (
              <div className={`w-12 h-12 bg-gradient-to-br
                               ${meta.from} ${meta.to}
                               rounded-xl flex items-center
                               justify-center
                               shadow-[0_3px_10px_0_var(--glow)]
                               group-hover:scale-110
                               transition-transform duration-200`}
                style={{ '--glow': meta.glow }}
              >
                <Trophy size={20} className="text-white" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-zinc-100
                              dark:bg-zinc-800 rounded-xl
                              flex items-center justify-center">
                <Lock size={18}
                  className="text-zinc-300 dark:text-zinc-600" />
              </div>
            )}

            {/* Earned checkmark */}
            {a.earned && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5
                              bg-green-500 rounded-full flex items-center
                              justify-center border-2 border-white
                              dark:border-[#141418]
                              shadow-sm">
                <Check size={10} className="text-white" />
              </div>
            )}
          </div>

          {/* XP badge */}
          <div className={`flex items-center gap-1 px-2.5 py-1
                           rounded-full text-xs font-bold
                           transition-all duration-200
            ${a.earned
              ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            }`}>
            <Zap size={11}
              className={a.earned ? 'text-brand-500' : 'text-zinc-400'} />
            {a.xp_value} XP
          </div>
        </div>

        {/* Name */}
        <h3 className={`font-bold mb-1 text-sm transition-colors
          ${a.earned
            ? 'text-zinc-900 dark:text-zinc-100'
            : 'text-zinc-400 dark:text-zinc-600'
          }`}>
          {a.earned ? a.name : '???'}
        </h3>

        {/* Description */}
        <p className={`text-xs leading-relaxed mb-4
          ${a.earned
            ? 'text-zinc-500 dark:text-zinc-400'
            : 'text-zinc-400 dark:text-zinc-600'
          }`}>
          {a.earned
            ? a.description
            : 'Keep training to unlock this achievement'
          }
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <span className={`badge capitalize text-xs
            ${a.earned
              ? meta.color
              : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600'
            }`}>
            {a.category}
          </span>

          {a.earned ? (
            <span className="text-xs text-zinc-400 flex items-center
                             gap-1">
              <Check size={10} className="text-green-500" />
              {new Date(a.earned_at).toLocaleDateString('en', {
                month: 'short', day: 'numeric',
              })}
            </span>
          ) : (
            <span className="text-xs text-zinc-300 dark:text-zinc-700
                             flex items-center gap-1">
              <Lock size={10} />
              Locked
            </span>
          )}
        </div>
      </div>

      {/* Earned: hover glow overlay */}
      {a.earned && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100
                     transition-opacity duration-300 pointer-events-none
                     rounded-2xl"
          style={{
            background: `radial-gradient(circle at 70% 0%, ${meta.glow}, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [xp,           setXP]           = useState({});
  const [filter,       setFilter]       = useState('all');
  const [showEarned,   setShowEarned]   = useState('all'); // 'all' | 'earned' | 'locked'
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/achievements/'),
      api.get('/achievements/xp'),
    ]).then(([a, x]) => {
      setAchievements(a.data);
      setXP(x.data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const categories = [
    'all',
    ...new Set(achievements.map(a => a.category)),
  ];

  const categoryCounts = categories.reduce((acc, c) => {
    acc[c] = c === 'all'
      ? achievements.length
      : achievements.filter(a => a.category === c).length;
    return acc;
  }, {});

  const earnedCounts = categories.reduce((acc, c) => {
    acc[c] = c === 'all'
      ? achievements.filter(a => a.earned).length
      : achievements.filter(a => a.category === c && a.earned).length;
    return acc;
  }, {});

  const earned = achievements.filter(a => a.earned).length;
  const total  = achievements.length;

  let filtered = filter === 'all'
    ? achievements
    : achievements.filter(a => a.category === filter);

  if (showEarned === 'earned')
    filtered = filtered.filter(a => a.earned);
  if (showEarned === 'locked')
    filtered = filtered.filter(a => !a.earned);

  // Earned first, then locked
  const sorted = [
    ...filtered.filter(a =>  a.earned),
    ...filtered.filter(a => !a.earned),
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Achievements</h1>
          <p className="page-subtitle">
            Earn badges and XP by hitting your fitness milestones.
          </p>
        </div>
        {/* Earned / Locked toggle */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/80
                        rounded-xl p-1">
          {[
            { key:'all',    label:'All'    },
            { key:'earned', label:'Earned' },
            { key:'locked', label:'Locked' },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => setShowEarned(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium
                          transition-all duration-150
                ${showEarned === key
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
                }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── XP card ── */}
      {loading ? (
        <div className="skeleton h-44 rounded-2xl" />
      ) : (
        <XPCard xp={xp} earned={earned} total={total} />
      )}

      {/* ── Category filter ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map(c => {
          const count   = categoryCounts[c];
          const earnedC = earnedCounts[c];
          return (
            <button key={c}
              onClick={() => setFilter(c)}
              className={`flex items-center gap-1.5 px-3.5 py-2
                          rounded-xl text-xs font-medium
                          whitespace-nowrap transition-all border
                          flex-shrink-0
                ${filter === c
                  ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}>
              <span className="capitalize">{c}</span>
              {/* Earned / total pill */}
              <span className={`px-1.5 py-0.5 rounded-full text-2xs
                                font-bold transition-colors
                ${filter === c
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}>
                {earnedC}/{count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2
                        lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800
                          rounded-2xl flex items-center justify-center
                          mx-auto mb-4">
            <Trophy size={28}
              className="text-zinc-300 dark:text-zinc-600" />
          </div>
          <p className="font-semibold text-zinc-500
                         dark:text-zinc-400 mb-1">
            No achievements found
          </p>
          <p className="text-sm text-zinc-400">
            Try a different filter or keep training to unlock more
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2
                        lg:grid-cols-3 gap-4">
          {sorted.map((a, i) => (
            <AchievementCard key={a.id} achievement={a} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}