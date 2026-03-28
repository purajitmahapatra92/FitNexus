import { useState, useEffect } from 'react';
import {
  Plus, Trash2, TrendingUp, Trophy, Zap,
  Check, ChevronDown, BarChart2, Target,
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

const METRIC_TYPES = [
  'weight', 'body_fat', 'chest',
  'waist', 'hips', 'arms', 'legs',
];

const METRIC_ICONS = {
  weight:   '⚖️',
  body_fat: '📊',
  chest:    '💪',
  waist:    '📏',
  hips:     '📐',
  arms:     '💪',
  legs:     '🦵',
};

const METRIC_UNITS = {
  weight:   'kg',
  body_fat: '%',
  chest:    'cm',
  waist:    'cm',
  hips:     'cm',
  arms:     'cm',
  legs:     'cm',
};

// Epley 1RM
function calc1RM(weight, reps) {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

const chartOpts = {
  responsive:          true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1a20',
      titleColor:      '#f1f5f9',
      bodyColor:       '#94a3b8',
      borderColor:     '#2d2d35',
      borderWidth:     1,
      padding:         10,
      cornerRadius:    8,
    },
  },
  scales: {
    x: {
      grid:  { color:'rgba(0,0,0,0.04)' },
      ticks: { color:'#94a3b8', font:{ size:11 } },
    },
    y: {
      grid:  { color:'rgba(0,0,0,0.04)' },
      ticks: { color:'#94a3b8', font:{ size:11 } },
      beginAtZero: false,
    },
  },
};

// ── 1RM Calculator ────────────────────────────────────────────
function OneRMCalculator() {
  const [weight, setWeight] = useState('');
  const [reps,   setReps]   = useState('');
  const result = weight && reps
    ? calc1RM(Number(weight), Number(reps)) : null;

  const percentages = result
    ? [100,95,90,85,80,75,70,65,60].map(pct => ({
        pct,
        weight: Math.round(result * pct / 100),
        reps:   pct >= 95 ? 1
              : pct >= 90 ? 2
              : pct >= 85 ? 3
              : pct >= 80 ? 5
              : pct >= 75 ? 6
              : pct >= 70 ? 8
              : pct >= 65 ? 10
              : pct >= 60 ? 12 : 15,
      }))
    : [];

  return (
    <div className="card p-5 h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 bg-brand-50 dark:bg-brand-900/20
                        rounded-xl flex items-center justify-center">
          <Zap size={16} className="text-brand-500" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900
                         dark:text-zinc-100 text-sm">
            1RM Calculator
          </h3>
          <p className="text-xs text-zinc-400">
            Epley formula
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label">Weight (kg)</label>
          <input
            type="number" className="input text-center font-bold"
            placeholder="100" min="0" step="0.5"
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Reps</label>
          <input
            type="number" className="input text-center font-bold"
            placeholder="5" min="1" max="30"
            value={reps}
            onChange={e => setReps(e.target.value)}
          />
        </div>
      </div>

      {/* Result */}
      {result ? (
        <div className="space-y-3">
          {/* Big result */}
          <div className="relative overflow-hidden rounded-2xl
                          bg-gradient-to-br from-brand-500
                          to-brand-600 p-4 text-center">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 70% 30%, white 0%, transparent 60%)',
              }} />
            <p className="text-xs font-semibold text-brand-100/80
                           uppercase tracking-widest mb-1">
              Estimated 1RM
            </p>
            <p className="text-4xl font-bold text-white tabular-nums">
              {result}
              <span className="text-xl font-normal text-brand-200 ml-1">
                kg
              </span>
            </p>
          </div>

          {/* Percentage table */}
          <div className="space-y-1">
            <p className="text-2xs font-semibold text-zinc-400
                           uppercase tracking-widest px-1 mb-2">
              Training zones
            </p>
            {percentages.map(({ pct, weight: w, reps: r }) => (
              <div key={pct}
                className="flex items-center gap-3 py-1.5 px-2
                           rounded-lg hover:bg-zinc-50
                           dark:hover:bg-zinc-800/60
                           transition-colors group">
                <div className="w-10 flex-shrink-0">
                  <span className="text-xs font-bold text-zinc-500
                                   dark:text-zinc-400 tabular-nums">
                    {pct}%
                  </span>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800
                                  rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r
                                 from-brand-500 to-brand-400
                                 transition-all duration-500"
                      style={{ width:`${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-700
                                  dark:text-zinc-300 tabular-nums w-14
                                  text-right">
                  {w} kg
                </span>
                <span className="text-xs text-zinc-400 w-12
                                  text-right tabular-nums">
                  ~{r} reps
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center
                        py-8 text-center">
          <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20
                          rounded-2xl flex items-center justify-center
                          mb-3">
            <Target size={22} className="text-brand-400" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
            Enter weight and reps
          </p>
          <p className="text-xs text-zinc-400">
            to calculate your estimated max
          </p>
        </div>
      )}
    </div>
  );
}

// ── Strength chart per exercise ───────────────────────────────
function StrengthChart({ exerciseId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!exerciseId) return;
    api.get(`/progress/prs/${exerciseId}`)
      .then(r => setHistory(r.data))
      .catch(console.error);
  }, [exerciseId]);

  if (!history.length) return (
    <div className="flex items-center justify-center h-48">
      <div className="text-center">
        <BarChart2 size={28}
          className="mx-auto text-zinc-200 dark:text-zinc-700 mb-2" />
        <p className="text-sm text-zinc-400">
          No session data for this exercise yet
        </p>
      </div>
    </div>
  );

  const oneRMs = history.map(h =>
    calc1RM(Number(h.weight_kg), Number(h.reps))
  );

  const data = {
    labels: history.map(h =>
      new Date(h.achieved_at).toLocaleDateString('en', {
        month:'short', day:'numeric',
      })
    ),
    datasets: [
      {
        label:               'Weight (kg)',
        data:                history.map(h => Number(h.weight_kg)),
        borderColor:         '#6366f1',
        backgroundColor:     'rgba(99,102,241,0.08)',
        borderWidth:         2,
        fill:                true,
        tension:             0.4,
        pointBackgroundColor:'#6366f1',
        pointRadius:         4,
        pointHoverRadius:    6,
      },
      {
        label:               'Est. 1RM',
        data:                oneRMs,
        borderColor:         '#10b981',
        backgroundColor:     'transparent',
        borderWidth:         2,
        borderDash:          [4,4],
        tension:             0.4,
        pointBackgroundColor:'#10b981',
        pointRadius:         3,
        pointHoverRadius:    5,
        fill:                false,
      },
    ],
  };

  const latestRM = oneRMs[oneRMs.length - 1];
  const firstRM  = oneRMs[0];
  const gain     = latestRM - firstRM;

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-0.5 bg-brand-500 inline-block
                           rounded" />
          <span className="text-zinc-500 dark:text-zinc-400">
            Weight lifted
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 border-t-2 border-dashed
                           border-green-500 inline-block" />
          <span className="text-zinc-500 dark:text-zinc-400">
            Est. 1RM
          </span>
        </div>
        {gain > 0 && (
          <span className="ml-auto badge bg-green-100 text-green-700
                           dark:bg-green-900/20 dark:text-green-400
                           font-semibold">
            +{gain}kg 1RM gain
          </span>
        )}
      </div>
      <div className="h-52">
        <Line data={data} options={chartOpts} />
      </div>
    </div>
  );
}

// ── Main Progress page ────────────────────────────────────────
export default function Progress() {
  const [metrics,       setMetrics]       = useState([]);
  const [prs,           setPRs]           = useState([]);
  const [showForm,      setShowForm]      = useState(false);
  const [activeMetric,  setActiveMetric]  = useState('weight');
  const [activeExercise,setActiveExercise]= useState(null);
  const [loading,       setLoading]       = useState(true);
  const [saved,         setSaved]         = useState(false);
  const [form, setForm] = useState({
    metric_type:'weight', value:'', unit:'kg', notes:'',
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        api.get('/progress/metrics'),
        api.get('/progress/prs'),
      ]);
      setMetrics(m.data);
      setPRs(p.data);
      if (p.data.length > 0 && !activeExercise) {
        setActiveExercise(p.data[0]);
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addMetric = async e => {
    e.preventDefault();
    try {
      await api.post('/progress/metrics', {
        ...form, value: Number(form.value),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setShowForm(false);
      setForm({
        metric_type:'weight', value:'', unit:'kg', notes:'',
      });
      fetchAll();
    } catch(e) { console.error(e); }
  };

  const deleteMetric = async id => {
    try {
      await api.delete(`/progress/metrics/${id}`);
      fetchAll();
    } catch(e) { console.error(e); }
  };

  const filtered = metrics
    .filter(m => m.metric_type === activeMetric)
    .reverse();

  const chartData = {
    labels: filtered.map(m =>
      new Date(m.recorded_at).toLocaleDateString('en', {
        month:'short', day:'numeric',
      })
    ),
    datasets: [{
      data:                filtered.map(m => Number(m.value)),
      borderColor:         '#6366f1',
      backgroundColor:     'rgba(99,102,241,0.08)',
      borderWidth:         2,
      fill:                true,
      tension:             0.4,
      pointBackgroundColor:'#6366f1',
      pointRadius:         4,
      pointHoverRadius:    6,
    }],
  };

  const latest = filtered[filtered.length - 1];
  const prev   = filtered[filtered.length - 2];
  const change = latest && prev
    ? (Number(latest.value) - Number(prev.value)).toFixed(1) : null;
  const isPositive = Number(change) > 0;

  // Trend direction for weight — down is good, up is bad
  const trendColor = activeMetric === 'weight' || activeMetric === 'body_fat'
    ? (isPositive ? 'text-red-500' : 'text-green-500')
    : (isPositive ? 'text-green-500' : 'text-red-500');

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Progress</h1>
          <p className="page-subtitle">
            Track body metrics, strength gains, and personal records.
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="btn-primary"
        >
          <Plus size={16} /> Log metric
        </button>
      </div>

      {/* ── Saved confirmation ── */}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                        bg-green-50 dark:bg-green-900/20
                        border border-green-100 dark:border-green-800
                        text-sm font-medium text-green-700
                        dark:text-green-400 animate-slide-up">
          <Check size={15} />
          Measurement saved!
        </div>
      )}

      {/* ── Log form ── */}
      {showForm && (
        <div className="card p-5 animate-slide-down
                        border-brand-100 dark:border-brand-900/40">
          <h3 className="font-semibold text-zinc-900
                         dark:text-zinc-100 mb-4">
            Log a measurement
          </h3>
          <form onSubmit={addMetric}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="label">Metric</label>
              <select className="input capitalize"
                value={form.metric_type}
                onChange={e => setForm(f => ({
                  ...f,
                  metric_type: e.target.value,
                  unit: METRIC_UNITS[e.target.value] || 'kg',
                }))}>
                {METRIC_TYPES.map(t => (
                  <option key={t} value={t}
                    className="capitalize">
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Value</label>
              <input type="number" required step="0.1"
                className="input" placeholder="75.5"
                value={form.value}
                onChange={e => setForm(f => ({
                  ...f, value: e.target.value,
                }))}
              />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit}
                onChange={e => setForm(f => ({
                  ...f, unit: e.target.value,
                }))}>
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
                <option value="cm">cm</option>
                <option value="%">%</option>
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input className="input"
                placeholder="Morning, fasted"
                value={form.notes}
                onChange={e => setForm(f => ({
                  ...f, notes: e.target.value,
                }))}
              />
            </div>
            <div className="col-span-2 sm:col-span-4
                            flex gap-2 justify-end">
              <button type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save measurement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Body metric chart + 1RM side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Body metric chart */}
        <div className="card p-5 lg:col-span-2">
          {/* Metric type tabs — scrollable */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide
                          pb-3 mb-4 border-b border-zinc-50
                          dark:border-zinc-800/60">
            {METRIC_TYPES.map(t => (
              <button key={t}
                onClick={() => setActiveMetric(t)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5
                            rounded-xl text-xs font-medium
                            whitespace-nowrap transition-all border
                            flex-shrink-0
                  ${activeMetric === t
                    ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                  }`}>
                <span>{METRIC_ICONS[t]}</span>
                <span className="capitalize">
                  {t.replace('_',' ')}
                </span>
              </button>
            ))}
          </div>

          {/* Current value row */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900
                             dark:text-zinc-100 capitalize mb-0.5">
                {activeMetric.replace('_',' ')} over time
              </h3>
              <p className="text-xs text-zinc-400">
                {filtered.length} measurement
                {filtered.length !== 1 ? 's' : ''} logged
              </p>
            </div>
            {latest && (
              <div className="text-right">
                <p className="text-2xl font-bold text-zinc-900
                               dark:text-zinc-100 tabular-nums">
                  {Number(latest.value).toFixed(1)}
                  <span className="text-sm font-normal text-zinc-400
                                   ml-1">
                    {latest.unit}
                  </span>
                </p>
                {change !== null && (
                  <p className={`text-xs font-semibold ${trendColor}`}>
                    {isPositive ? '▲' : '▼'}{' '}
                    {Math.abs(Number(change))} {latest.unit}
                    {' '}from previous
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="h-52">
            {loading ? (
              <div className="skeleton h-full rounded-xl" />
            ) : filtered.length > 1 ? (
              <Line data={chartData} options={chartOpts} />
            ) : (
              <div className="flex flex-col items-center
                              justify-center h-full text-center">
                <TrendingUp size={28}
                  className="text-zinc-200 dark:text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-400">
                  Log at least 2 entries to see the chart
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 1RM Calculator */}
        <OneRMCalculator />
      </div>

      {/* ── Strength progression ── */}
      {prs.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20
                            rounded-lg flex items-center justify-center">
              <Trophy size={16} className="text-amber-500" />
            </div>
            <h3 className="font-semibold text-zinc-900
                           dark:text-zinc-100 text-sm">
              Strength Progression
            </h3>
          </div>

          {/* Exercise selector tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide
                          pb-3 mb-4">
            {prs.map(pr => (
              <button
                key={pr.exercise_id}
                onClick={() => setActiveExercise(pr)}
                className={`px-3.5 py-1.5 rounded-xl text-xs
                            font-medium whitespace-nowrap transition-all
                            border flex-shrink-0
                  ${activeExercise?.exercise_id === pr.exercise_id
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-300 dark:hover:border-amber-700'
                  }`}>
                {pr.exercise_name}
              </button>
            ))}
          </div>

          {/* PR stats row */}
          {activeExercise && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                {
                  label: 'Current PR',
                  value: `${activeExercise.weight_kg}kg`,
                  sub:   `${activeExercise.reps} reps`,
                  icon:  Trophy,
                  color: 'text-amber-500',
                  bg:    'bg-amber-50 dark:bg-amber-900/20',
                },
                {
                  label: 'Est. 1RM',
                  value: `${calc1RM(
                    Number(activeExercise.weight_kg),
                    Number(activeExercise.reps)
                  )}kg`,
                  sub:   'Epley formula',
                  icon:  Zap,
                  color: 'text-brand-500',
                  bg:    'bg-brand-50 dark:bg-brand-900/20',
                },
                {
                  label: 'Muscle group',
                  value: activeExercise.muscle_group,
                  sub:   new Date(activeExercise.achieved_at)
                    .toLocaleDateString('en', {
                      month:'short', day:'numeric',
                    }),
                  icon:  TrendingUp,
                  color: 'text-green-500',
                  bg:    'bg-green-50 dark:bg-green-900/20',
                },
              ].map(({ label, value, sub, icon:Icon, color, bg }) => (
                <div key={label}
                  className="bg-zinc-50 dark:bg-zinc-800/60
                             rounded-xl p-3.5 text-center group
                             hover:shadow-sm transition-shadow">
                  <div className={`w-8 h-8 ${bg} rounded-lg
                                   flex items-center justify-center
                                   mx-auto mb-2
                                   group-hover:scale-110
                                   transition-transform duration-200`}>
                    <Icon size={15} className={color} />
                  </div>
                  <p className="font-bold text-zinc-900
                                 dark:text-zinc-100 tabular-nums">
                    {value}
                  </p>
                  <p className="text-xs text-zinc-500
                                 dark:text-zinc-400 mt-0.5">
                    {label}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Strength chart */}
          {activeExercise && (
            <StrengthChart
              exerciseId={activeExercise.exercise_id}
            />
          )}
        </div>
      )}

      {/* ── PR cards grid ── */}
      {prs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-zinc-900
                           dark:text-zinc-100">
              All Personal Records
            </h3>
            <span className="badge bg-amber-100 text-amber-700
                             dark:bg-amber-900/20 dark:text-amber-400">
              {prs.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2
                          lg:grid-cols-3 gap-3">
            {prs.map(pr => {
              const oneRM = calc1RM(
                Number(pr.weight_kg), Number(pr.reps)
              );
              return (
                <div key={pr.exercise_id}
                  className="card p-4 flex items-center gap-3
                             group hover:shadow-card-md
                             hover:-translate-y-0.5
                             transition-all duration-200 relative
                             overflow-hidden">
                  {/* Glow on hover */}
                  <div className="absolute -top-4 -right-4 w-16 h-16
                                  rounded-full bg-amber-400/15
                                  opacity-0 group-hover:opacity-100
                                  transition-opacity duration-300
                                  blur-xl pointer-events-none" />
                  <div className="w-10 h-10 bg-gradient-to-br
                                  from-amber-400 to-amber-600
                                  rounded-xl flex items-center
                                  justify-center flex-shrink-0
                                  shadow-[0_2px_8px_0_rgb(245_158_11_/_0.3)]
                                  group-hover:scale-110
                                  transition-transform duration-200">
                    <Trophy size={17} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900
                                   dark:text-zinc-100 truncate">
                      {pr.exercise_name}
                    </p>
                    <p className="text-xs text-zinc-500
                                   dark:text-zinc-400 mt-0.5">
                      <span className="font-semibold text-zinc-700
                                       dark:text-zinc-300 tabular-nums">
                        {pr.weight_kg}kg × {pr.reps}
                      </span>
                      <span className="mx-1 text-zinc-300
                                       dark:text-zinc-700">
                        ·
                      </span>
                      <span className="text-brand-500 tabular-nums">
                        1RM ~{oneRM}kg
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Measurement history ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-zinc-900
                         dark:text-zinc-100 text-sm capitalize">
            {activeMetric.replace('_',' ')} history
          </h3>
          <span className="badge bg-zinc-100 text-zinc-600
                           dark:bg-zinc-800 dark:text-zinc-400">
            {filtered.length} entries
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800
                            rounded-2xl flex items-center justify-center
                            mb-3">
              <TrendingUp size={20}
                className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
              No entries yet
            </p>
            <p className="text-xs text-zinc-400">
              Log your first{' '}
              {activeMetric.replace('_',' ')}{' '}
              measurement above
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {[...filtered].reverse().map((m, idx) => {
              const prevEntry = [...filtered].reverse()[idx + 1];
              const diff = prevEntry
                ? Number(m.value) - Number(prevEntry.value) : null;
              const isPos = diff !== null && diff > 0;
              const diffColor = activeMetric === 'weight' ||
                                activeMetric === 'body_fat'
                ? (isPos ? 'text-red-500' : 'text-green-500')
                : (isPos ? 'text-green-500' : 'text-red-500');

              return (
                <div key={m.id}
                  className="flex items-center justify-between
                             py-3 px-3 rounded-xl group
                             hover:bg-zinc-50 dark:hover:bg-zinc-800/40
                             transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100
                                    dark:bg-zinc-800 rounded-lg
                                    flex items-center justify-center
                                    flex-shrink-0 text-sm">
                      {METRIC_ICONS[activeMetric]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900
                                     dark:text-zinc-100 tabular-nums">
                        {Number(m.value).toFixed(1)}{' '}
                        <span className="font-normal text-zinc-400
                                         text-xs">
                          {m.unit}
                        </span>
                      </p>
                      <p className="text-xs text-zinc-400">
                        {new Date(m.recorded_at).toLocaleDateString(
                          'en', {
                            month:'long', day:'numeric',
                            year:'numeric',
                          }
                        )}
                        {m.notes ? ` · ${m.notes}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {diff !== null && (
                      <span className={`text-xs font-semibold
                                        ${diffColor} tabular-nums`}>
                        {isPos ? '+' : ''}{diff.toFixed(1)}
                        {m.unit}
                      </span>
                    )}
                    <button
                      onClick={() => deleteMetric(m.id)}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}