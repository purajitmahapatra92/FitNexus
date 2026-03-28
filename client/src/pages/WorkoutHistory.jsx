import { useState, useEffect } from 'react';
import {
  Calendar, Clock, Flame, TrendingUp,
  Trophy, ChevronDown, ChevronUp, Dumbbell,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from 'chart.js';
import api from '../services/api';

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler
);

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid:  { color: 'rgba(0,0,0,0.04)' },
      ticks: { color: '#94a3b8', font: { size: 11 } },
    },
    y: {
      grid:  { color: 'rgba(0,0,0,0.04)' },
      ticks: { color: '#94a3b8', font: { size: 11 } },
      beginAtZero: true,
    },
  },
};

function fmtDuration(mins) {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en', {
    month: 'short', day: 'numeric',
  });
}

// ── Session detail row ────────────────────────────────────────
function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false);
  const [detail,   setDetail]   = useState(null);
  const [loading,  setLoading]  = useState(false);

  const loadDetail = async () => {
    if (detail) { setExpanded(e => !e); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/workouts/sessions/${session.id}`);
      setDetail(data);
      setExpanded(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const prCount = detail?.sets?.filter(s => s.is_pr).length || 0;

  // Group sets by exercise for display
  const byExercise = detail?.sets?.reduce((acc, s) => {
    const key = s.exercise_name || s.exercise_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {}) || {};

  return (
    <div className="card overflow-hidden">
      {/* ── Session summary row ── */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center
                           justify-center flex-shrink-0
            ${session.status === 'completed'
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-amber-50 dark:bg-amber-900/20'
            }`}>
            <Dumbbell size={18} className={
              session.status === 'completed'
                ? 'text-green-500'
                : 'text-amber-500'
            } />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100
                           truncate">
              {session.workout_name || 'Workout'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {fmtDate(session.started_at)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 mx-4">
          {session.duration_minutes && (
            <div className="flex items-center gap-1.5 text-xs
                            text-zinc-500 dark:text-zinc-400">
              <Clock size={13} />
              {fmtDuration(session.duration_minutes)}
            </div>
          )}
          {session.calories_burned && (
            <div className="flex items-center gap-1.5 text-xs
                            text-zinc-500 dark:text-zinc-400">
              <Flame size={13} />
              {session.calories_burned} kcal
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge ${
            session.status === 'completed'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
          }`}>
            {session.status}
          </span>
          <button
            onClick={loadDetail}
            className="btn-ghost p-2"
            title="View details"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-brand-500
                                border-t-transparent rounded-full
                                animate-spin" />
              : expanded
                ? <ChevronUp size={16} />
                : <ChevronDown size={16} />
            }
          </button>
        </div>
      </div>

      {/* Mobile stats */}
      {(session.duration_minutes || session.calories_burned) && (
        <div className="sm:hidden flex items-center gap-4 px-5 pb-3">
          {session.duration_minutes && (
            <div className="flex items-center gap-1.5 text-xs
                            text-zinc-500 dark:text-zinc-400">
              <Clock size={13} />
              {fmtDuration(session.duration_minutes)}
            </div>
          )}
          {session.calories_burned && (
            <div className="flex items-center gap-1.5 text-xs
                            text-zinc-500 dark:text-zinc-400">
              <Flame size={13} />
              {session.calories_burned} kcal
            </div>
          )}
        </div>
      )}

      {/* ── Expanded detail ── */}
      {expanded && detail && (
        <div className="border-t border-zinc-100 dark:border-zinc-800
                        px-5 py-4 space-y-4">

          {/* Session stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Duration',
                value: fmtDuration(detail.duration_minutes),
                icon:  Clock,
              },
              {
                label: 'Calories',
                value: detail.calories_burned
                  ? `${detail.calories_burned} kcal` : '—',
                icon:  Flame,
              },
              {
                label: 'PRs Hit',
                value: prCount,
                icon:  Trophy,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label}
                className="bg-zinc-50 dark:bg-zinc-800 rounded-xl
                           p-3 text-center">
                <Icon size={16}
                  className="mx-auto text-brand-500 mb-1.5" />
                <p className="text-sm font-bold text-zinc-900
                               dark:text-zinc-100">
                  {value}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* PR alert */}
          {prCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20
                            border border-amber-100 dark:border-amber-800
                            flex items-center gap-2">
              <Trophy size={15} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs font-medium text-amber-700
                             dark:text-amber-300">
                {prCount} new personal record
                {prCount > 1 ? 's' : ''} set this session!
              </p>
            </div>
          )}

          {/* Exercise breakdown */}
          {Object.keys(byExercise).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400
                             uppercase tracking-wide mb-3">
                Exercise log
              </p>
              <div className="space-y-3">
                {Object.entries(byExercise).map(([exName, sets]) => {
                  const totalVol = sets.reduce(
                    (s, set) => s + Number(set.weight_kg) * Number(set.reps),
                    0
                  );
                  const hasPR = sets.some(s => s.is_pr);
                  return (
                    <div key={exName}
                      className="border border-zinc-100 dark:border-zinc-800
                                 rounded-xl overflow-hidden">
                      <div className={`flex items-center justify-between
                                       px-4 py-2.5
                        ${hasPR
                          ? 'bg-amber-50 dark:bg-amber-900/10'
                          : 'bg-zinc-50 dark:bg-zinc-800/50'
                        }`}>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-zinc-800
                                         dark:text-zinc-200">
                            {exName}
                          </p>
                          {hasPR && (
                            <Trophy size={12} className="text-amber-500" />
                          )}
                        </div>
                        <span className="text-xs text-zinc-400">
                          Vol: {Math.round(totalVol)} kg
                        </span>
                      </div>
                      <div className="px-4 py-2">
                        <div className="grid grid-cols-4 text-xs font-medium
                                        text-zinc-400 dark:text-zinc-500 pb-1">
                          <span>Set</span>
                          <span className="text-right">Weight</span>
                          <span className="text-right">Reps</span>
                          <span className="text-right">PR</span>
                        </div>
                        {sets.map((s, si) => (
                          <div key={si}
                            className="grid grid-cols-4 text-xs py-1
                                       border-t border-zinc-50
                                       dark:border-zinc-800">
                            <span className="text-zinc-500
                                             dark:text-zinc-400">
                              {s.set_number}
                            </span>
                            <span className="text-right font-medium
                                             text-zinc-700 dark:text-zinc-300">
                              {s.weight_kg} kg
                            </span>
                            <span className="text-right text-zinc-600
                                             dark:text-zinc-400">
                              {s.reps}
                            </span>
                            <span className="text-right">
                              {s.is_pr
                                ? <Trophy size={11}
                                    className="text-amber-500 ml-auto" />
                                : '—'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Session notes */}
          {detail.notes && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <p className="text-xs font-semibold text-zinc-400
                             uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {detail.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function WorkoutHistory() {
  const [sessions,  setSessions]  = useState([]);
  const [volume,    setVolume]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [page,      setPage]      = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    Promise.all([
      api.get('/workouts/sessions/all'),
      api.get('/progress/volume'),
    ]).then(([s, v]) => {
      setSessions(s.data);
      setVolume(v.data);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  // Filter sessions
  const filtered = sessions.filter(s => {
    if (filter === 'completed') return s.status === 'completed';
    if (filter === 'incomplete') return s.status !== 'completed';
    return true;
  });

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore   = paginated.length < filtered.length;

  // Stats
  const completed   = sessions.filter(s => s.status === 'completed');
  const totalMins   = completed.reduce((s, c) => s + (c.duration_minutes || 0), 0);
  const totalCal    = completed.reduce((s, c) => s + (c.calories_burned  || 0), 0);
  const avgDuration = completed.length
    ? Math.round(totalMins / completed.length) : 0;

  // Volume chart data
  const volData = {
    labels: volume.map(v => fmtShortDate(v.date)),
    datasets: [{
      data:                volume.map(v => Math.round(Number(v.total_volume))),
      borderColor:         '#6366f1',
      backgroundColor:     'rgba(99,102,241,0.08)',
      borderWidth:         2,
      fill:                true,
      tension:             0.4,
      pointBackgroundColor:'#6366f1',
      pointRadius:         3,
    }],
  };

  // Workout frequency — count sessions per week
  const weeklyFreq = () => {
    const weeks = {};
    sessions.forEach(s => {
      const d    = new Date(s.started_at);
      const week = `${d.getFullYear()}-W${getWeekNum(d)}`;
      weeks[week] = (weeks[week] || 0) + 1;
    });
    const entries = Object.entries(weeks).slice(-8);
    return {
      labels: entries.map(([w]) => w.split('-W')[1]
        ? `Wk ${w.split('-W')[1]}` : w),
      datasets: [{
        data:                entries.map(([, v]) => v),
        borderColor:         '#10b981',
        backgroundColor:     'rgba(16,185,129,0.08)',
        borderWidth:         2,
        fill:                true,
        tension:             0.4,
        pointBackgroundColor:'#10b981',
        pointRadius:         3,
      }],
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="page-title">Workout History</h1>
        <p className="page-subtitle">
          All your sessions, stats, and progress over time.
        </p>
      </div>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total workouts',
            value: completed.length,
            icon:  Dumbbell,
            color: 'text-brand-500',
            bg:    'bg-brand-50 dark:bg-brand-900/20',
          },
          {
            label: 'Total time',
            value: fmtDuration(totalMins),
            icon:  Clock,
            color: 'text-blue-500',
            bg:    'bg-blue-50 dark:bg-blue-900/20',
          },
          {
            label: 'Avg duration',
            value: fmtDuration(avgDuration),
            icon:  TrendingUp,
            color: 'text-green-500',
            bg:    'bg-green-50 dark:bg-green-900/20',
          },
          {
            label: 'Total calories',
            value: totalCal > 0
              ? `${totalCal.toLocaleString()} kcal`
              : '—',
            icon:  Flame,
            color: 'text-orange-500',
            bg:    'bg-orange-50 dark:bg-orange-900/20',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label}
            className="card p-5 flex flex-col justify-between
                       min-h-[110px]">
            <div className={`w-9 h-9 rounded-xl ${bg}
                             flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500
                             dark:text-zinc-400 uppercase tracking-wide">
                {label}
              </p>
              <p className="text-2xl font-bold text-zinc-900
                             dark:text-zinc-100 mt-0.5">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      {volume.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-zinc-900
                           dark:text-zinc-100 mb-4">
              Training volume (30 days)
            </h3>
            <div className="h-44">
              <Line data={volData} options={chartOpts} />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-zinc-900
                           dark:text-zinc-100 mb-4">
              Sessions per week
            </h3>
            <div className="h-44">
              <Line data={weeklyFreq()} options={chartOpts} />
            </div>
          </div>
        </div>
      )}

      {/* ── Session list ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Sessions
            <span className="text-sm font-normal text-zinc-400 ml-2">
              ({filtered.length})
            </span>
          </h3>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800
                          rounded-xl p-1">
            {[
              { key:'all',        label:'All'        },
              { key:'completed',  label:'Completed'  },
              { key:'incomplete', label:'Incomplete' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => { setFilter(key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium
                            transition-all
                  ${filter === key
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
                  }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card h-20 skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar size={40}
              className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
            <p className="font-medium text-zinc-500 dark:text-zinc-400">
              No sessions yet
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              Complete a workout to see it here.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map(s => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary w-full"
              >
                Load more sessions
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getWeekNum(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}