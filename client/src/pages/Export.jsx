import { useState, useEffect, useRef } from 'react';
import {
  Download, Dumbbell, Apple, TrendingUp,
  Trophy, CheckCircle2, AlertCircle, FileText,
  Zap, Clock, Database,
} from 'lucide-react';

const EXPORTS = [
  {
    key:       'workouts',
    label:     'Workout History',
    desc:      'All completed sessions with every set, rep, weight, and PR flag.',
    icon:      Dumbbell,
    color:     'from-brand-500 to-brand-600',
    light:     'bg-brand-50 dark:bg-brand-900/20',
    iconColor: 'text-brand-500',
    badge:     'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
    columns:   ['session','workout','split','date','duration',
                 'exercise','muscle','set','reps','weight','PR'],
  },
  {
    key:       'nutrition',
    label:     'Nutrition Logs',
    desc:      'Every food item logged with calories, protein, carbs, fat, and fiber.',
    icon:      Apple,
    color:     'from-green-500 to-emerald-600',
    light:     'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-500',
    badge:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    columns:   ['date','meal','food','serving','calories',
                 'protein','carbs','fat','fiber'],
  },
  {
    key:       'progress',
    label:     'Body Metrics',
    desc:      'All logged measurements — weight, body fat, chest, waist, arms, legs.',
    icon:      TrendingUp,
    color:     'from-purple-500 to-violet-600',
    light:     'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-500',
    badge:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    columns:   ['metric type','value','unit','notes','date'],
  },
  {
    key:       'prs',
    label:     'Personal Records',
    desc:      'All-time personal records per exercise with weight, reps, and date.',
    icon:      Trophy,
    color:     'from-amber-500 to-orange-600',
    light:     'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-500',
    badge:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    columns:   ['exercise','muscle group','weight','reps','date achieved'],
  },
];

// ── Scroll reveal ─────────────────────────────────────────────
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

// ── Export card ───────────────────────────────────────────────
function ExportCard({ item, status, onExport, index }) {
  const [ref, visible] = useReveal(0.1);
  const {
    key, label, desc, icon: Icon,
    color, light, iconColor, badge, columns,
  } = item;
  const s = status[key];

  return (
    <div
      ref={ref}
      className={`card overflow-hidden group
                  hover:shadow-card-md hover:-translate-y-0.5
                  transition-all duration-500
        ${visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6'
        }`}
      style={{ transitionDelay:`${index * 80}ms` }}
    >
      {/* Gradient top strip */}
      <div className={`h-1 bg-gradient-to-r ${color}`} />

      <div className="p-5 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl ${light}
                           flex items-center justify-center
                           flex-shrink-0 group-hover:scale-110
                           transition-transform duration-200`}>
            <Icon size={20} className={iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-900
                           dark:text-zinc-100">
              {label}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400
                           mt-0.5 leading-relaxed">
              {desc}
            </p>
          </div>
        </div>

        {/* Column pills */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50
                        rounded-xl border border-zinc-100
                        dark:border-zinc-800">
          <p className="text-2xs font-semibold text-zinc-400
                         uppercase tracking-widest mb-2">
            Columns included
          </p>
          <div className="flex flex-wrap gap-1.5">
            {columns.map(col => (
              <span key={col} className={`badge text-xs ${badge}`}>
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Action area */}
        {s === 'done' ? (
          <div className="flex items-center gap-2 px-4 py-3
                          rounded-xl bg-green-50 dark:bg-green-900/20
                          border border-green-100 dark:border-green-800
                          animate-slide-up">
            <div className="w-7 h-7 bg-green-500 rounded-full
                            flex items-center justify-center
                            flex-shrink-0">
              <CheckCircle2 size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-700
                             dark:text-green-400">
                Downloaded!
              </p>
              <p className="text-xs text-green-600/70
                             dark:text-green-500/70">
                Check your downloads folder
              </p>
            </div>
          </div>
        ) : s === 'error' ? (
          <div className="flex items-center gap-2 px-4 py-3
                          rounded-xl bg-red-50 dark:bg-red-900/20
                          border border-red-100 dark:border-red-800
                          animate-slide-up">
            <div className="w-7 h-7 bg-red-500 rounded-full
                            flex items-center justify-center
                            flex-shrink-0">
              <AlertCircle size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-600
                             dark:text-red-400">
                Export failed
              </p>
              <p className="text-xs text-red-500/70
                             dark:text-red-400/70">
                Please try again
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onExport(key)}
            disabled={s === 'loading'}
            className={`relative w-full flex items-center
                        justify-center gap-2 py-2.5 rounded-xl
                        font-semibold text-sm overflow-hidden
                        transition-all duration-200
                        disabled:opacity-70 disabled:cursor-not-allowed
                        group/btn
              ${s === 'loading'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                : `bg-gradient-to-r ${color} text-white
                   shadow-[0_2px_8px_0_rgba(0,0,0,0.15)]
                   hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.2)]
                   hover:-translate-y-0.5 active:translate-y-0`
              }`}
          >
            {s === 'loading' ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-400
                                border-t-transparent rounded-full
                                animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download size={15}
                  className="group-hover/btn:-translate-y-0.5
                             transition-transform duration-150" />
                Export CSV
              </>
            )}
            {/* Shimmer on hover */}
            {s !== 'loading' && (
              <div className="absolute inset-0 bg-gradient-to-r
                              from-transparent via-white/10
                              to-transparent -translate-x-full
                              group-hover/btn:translate-x-full
                              transition-transform duration-500" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Export all progress bar ───────────────────────────────────
function ExportAllProgress({ status }) {
  const total    = Object.keys(status).length;
  const done     = Object.values(status).filter(s => s === 'done').length;
  const loading  = Object.values(status).some(s => s === 'loading');
  const pct      = Math.round((done / total) * 100);

  if (!loading && done === 0) return null;

  return (
    <div className="card p-4 animate-slide-down">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-zinc-900
                       dark:text-zinc-100">
          {done === total ? 'All exports complete!' : 'Exporting data...'}
        </p>
        <span className={`text-sm font-bold tabular-nums
          ${done === total ? 'text-green-500' : 'text-brand-500'}`}>
          {done}/{total}
        </span>
      </div>
      <div className="w-full bg-zinc-100 dark:bg-zinc-800
                      rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500
            ${done === total
              ? 'bg-green-500'
              : 'bg-gradient-to-r from-brand-500 to-brand-400'
            }`}
          style={{ width:`${pct}%` }}
        >
          {/* Shimmer */}
          <div className="w-full h-full bg-gradient-to-r
                          from-transparent via-white/25
                          to-transparent
                          animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
      {done === total && (
        <p className="text-xs text-green-500 font-medium mt-2
                       flex items-center gap-1 animate-slide-up">
          <CheckCircle2 size={12} />
          All files downloaded to your folder
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function Export() {
  const [status, setStatus] = useState({
    workouts:  'idle',
    nutrition: 'idle',
    progress:  'idle',
    prs:       'idle',
  });

  const setKey = (key, val) =>
    setStatus(s => ({ ...s, [key]: val }));

  const handleExport = async key => {
    setKey(key, 'loading');
    try {
      const token =
        localStorage.getItem('fn_token') ||
        localStorage.getItem('token');

      if (!token) {
        setKey(key, 'error');
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/export/${key}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok)
        throw new Error(`Server returned ${response.status}`);

      const text  = await response.text();
      const blob  = new Blob([text], {
        type: 'text/csv;charset=utf-8;',
      });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      const today = new Date().toISOString().split('T')[0];
      a.href      = url;
      a.download  = `fitnexus_${key}_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setKey(key, 'done');
      setTimeout(() => setKey(key, 'idle'), 5000);
    } catch (e) {
      console.error('Export error:', e);
      setKey(key, 'error');
      setTimeout(() => setKey(key, 'idle'), 3000);
    }
  };

  const handleExportAll = async () => {
    for (const item of EXPORTS) {
      await handleExport(item.key);
      await new Promise(r => setTimeout(r, 600));
    }
  };

  const allIdle = Object.values(status).every(s => s === 'idle');
  const anyBusy = Object.values(status).some(
    s => s === 'loading' || s === 'done'
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between
                      flex-wrap gap-4">
        <div>
          <h1 className="page-title">Export Data</h1>
          <p className="page-subtitle">
            Download your data as CSV files for Excel,
            Google Sheets, or any analytics tool.
          </p>
        </div>
        <button
          onClick={handleExportAll}
          disabled={!allIdle}
          className="group flex items-center gap-2 px-4 py-2.5
                     rounded-xl border border-zinc-200
                     dark:border-zinc-700 text-zinc-600
                     dark:text-zinc-300 text-sm font-medium
                     hover:bg-zinc-50 dark:hover:bg-zinc-800
                     hover:-translate-y-0.5 transition-all
                     duration-200 disabled:opacity-50
                     disabled:cursor-not-allowed
                     disabled:translate-y-0"
        >
          <Download size={15}
            className="group-hover:-translate-y-0.5
                       transition-transform duration-150" />
          Export all
        </button>
      </div>

      {/* ── Export all progress ── */}
      {anyBusy && <ExportAllProgress status={status} />}

      {/* ── Info banner ── */}
      <div className="card p-4 flex items-start gap-3
                      bg-brand-50 dark:bg-brand-900/20
                      border-brand-100 dark:border-brand-800/60">
        <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/40
                        rounded-lg flex items-center justify-center
                        flex-shrink-0 mt-0.5">
          <Database size={15} className="text-brand-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-700
                         dark:text-brand-300">
            Your data, your way
          </p>
          <p className="text-xs text-brand-600/70
                         dark:text-brand-400/70 mt-0.5 leading-relaxed">
            All exports are standard CSV — open directly in Excel,
            Google Sheets, or import into any analytics tool.
            Only your account data is included.
          </p>
        </div>
      </div>

      {/* ── Export cards grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXPORTS.map((item, i) => (
          <ExportCard
            key={item.key}
            item={item}
            status={status}
            onExport={handleExport}
            index={i}
          />
        ))}
      </div>

      {/* ── Tips section ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-zinc-50 dark:bg-zinc-800
                          rounded-lg flex items-center justify-center">
            <FileText size={14} className="text-zinc-500" />
          </div>
          <h3 className="font-semibold text-zinc-900
                          dark:text-zinc-100 text-sm">
            Tips for using your data
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon:  '📊',
              title: 'Google Sheets',
              desc:  'File → Import → Upload CSV. Choose comma as separator.',
              color: 'bg-green-50 dark:bg-green-900/10',
            },
            {
              icon:  '📈',
              title: 'Microsoft Excel',
              desc:  'Data → From Text/CSV, select your file and follow the wizard.',
              color: 'bg-blue-50 dark:bg-blue-900/10',
            },
            {
              icon:  '🔍',
              title: 'Analysis tips',
              desc:  'Use pivot tables to analyse volume, calories by day, or PRs by muscle.',
              color: 'bg-purple-50 dark:bg-purple-900/10',
            },
          ].map(({ icon, title, desc, color }) => (
            <div key={title}
              className={`p-4 ${color} rounded-xl border
                          border-zinc-100 dark:border-zinc-800/60
                          group hover:-translate-y-0.5
                          transition-all duration-200`}>
              <div className="text-xl mb-2">{icon}</div>
              <p className="text-xs font-semibold text-zinc-700
                             dark:text-zinc-300 mb-1">
                {title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400
                             leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Zap,      label:'Instant download', sub:'No server wait' },
          { icon: Clock,    label:'Any time',          sub:'Your data always available' },
          { icon: Database, label:'Complete history',  sub:'Every entry included' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label}
            className="card p-4 text-center group
                       hover:shadow-card-md hover:-translate-y-0.5
                       transition-all duration-200">
            <div className="w-8 h-8 bg-zinc-50 dark:bg-zinc-800
                            rounded-xl flex items-center justify-center
                            mx-auto mb-2
                            group-hover:scale-110
                            transition-transform duration-200">
              <Icon size={15} className="text-zinc-500" />
            </div>
            <p className="text-xs font-semibold text-zinc-700
                           dark:text-zinc-300">
              {label}
            </p>
            <p className="text-2xs text-zinc-400 mt-0.5">
              {sub}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}