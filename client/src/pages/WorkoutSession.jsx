import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate }      from 'react-router-dom';
import {
  ChevronLeft, Square, Check, Plus, Minus,
  Timer, Trophy, Flame, CheckCircle2,
  RefreshCw, X, Search, Zap, BarChart2,
} from 'lucide-react';
import api                   from '../services/api';
import { useNotifications }  from '../context/NotificationContext';

// ── Rest Timer ────────────────────────────────────────────────
function RestTimer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running,   setRunning]   = useState(true);
  const interval = useRef(null);

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(interval.current);
          onDone();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval.current);
  }, [running]);

  const pct = Math.round(((seconds - remaining) / seconds) * 100);
  const m   = Math.floor(remaining / 60);
  const s   = remaining % 60;

  // Color shifts from green → amber → red as time runs out
  const remainingPct = (remaining / seconds) * 100;
  const strokeColor  = remainingPct > 50
    ? '#10b981'
    : remainingPct > 25
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm
                    flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-xs text-center
                      animate-scale-in">
        <p className="text-xs font-semibold text-zinc-400 uppercase
                      tracking-widest mb-2">
          Rest Timer
        </p>
        <p className="text-xs text-zinc-400 mb-6">
          Recovery time between sets
        </p>

        {/* Circle */}
        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 140 140">
            {/* Track */}
            <circle cx="70" cy="70" r="62"
              fill="none" strokeWidth="8"
              className="stroke-zinc-100 dark:stroke-zinc-800" />
            {/* Progress */}
            <circle cx="70" cy="70" r="62"
              fill="none" strokeWidth="8"
              stroke={strokeColor}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 62}`}
              strokeDashoffset={`${2 * Math.PI * 62 * (pct / 100)}`}
              style={{ transition:'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center
                          justify-center">
            <span className="text-4xl font-bold text-zinc-900
                             dark:text-zinc-100 tabular-nums leading-none">
              {m}:{String(s).padStart(2, '0')}
            </span>
            <span className="text-xs text-zinc-400 mt-1">
              remaining
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              clearInterval(interval.current);
              onDone();
            }}
            className="btn-primary flex-1"
          >
            Skip rest
          </button>
          <button
            onClick={() => {
              if (running) {
                clearInterval(interval.current);
                setRunning(false);
              } else {
                setRunning(true);
              }
            }}
            className="btn-secondary flex-1"
          >
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Swap Modal ────────────────────────────────────────────────
function SwapModal({ exercise, sessionId, onSwap, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [swapping,  setSwapping]  = useState(null);

  useEffect(() => {
    api.get(`/exercises?muscle=${encodeURIComponent(exercise.muscle_group)}`)
      .then(({ data }) => {
        setExercises(data.filter(e => e.id !== exercise.exercise_id));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [exercise]);

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.primary_muscle?.toLowerCase().includes(search.toLowerCase()) ||
    e.equipment?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSwap = async newEx => {
    setSwapping(newEx.id);
    try {
      await api.post(`/workouts/sessions/${sessionId}/swap`, {
        old_exercise_id: exercise.exercise_id,
        new_exercise_id: newEx.id,
      });
      onSwap({
        ...exercise,
        exercise_id:    newEx.id,
        exercise_name:  newEx.name,
        muscle_group:   newEx.muscle_group,
        equipment:      newEx.equipment,
        primary_muscle: newEx.primary_muscle,
        is_bodyweight:  newEx.equipment === 'Bodyweight',
      });
      onClose();
    } catch (e) { console.error(e); }
    finally { setSwapping(null); }
  };

  const REGION_COLORS = {
    Chest:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Back:      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    Shoulders: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    Arms:      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    Legs:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    Core:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    Cardio:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm
                    flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="card w-full max-w-lg flex flex-col animate-scale-in"
        style={{ height:'80vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between p-5
                        border-b border-zinc-100 dark:border-zinc-800
                        flex-shrink-0">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Swap exercise
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Replacing{' '}
              <span className="font-medium text-zinc-600
                               dark:text-zinc-300">
                {exercise.exercise_name}
              </span>
              {' · '}{exercise.muscle_group} alternatives
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2
                         text-zinc-400 pointer-events-none" />
            <input className="input pl-9 text-sm"
              placeholder="Search alternatives..."
              value={search} autoFocus
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide
                        px-5 min-h-0">
          {loading ? (
            <div className="space-y-2 py-2">
              {[1,2,3].map(i => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-zinc-400">
                No alternatives found.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtered.map(ex => (
                <div key={ex.id}
                  className="flex items-center justify-between
                             p-3 rounded-xl border border-zinc-100
                             dark:border-zinc-800 hover:border-zinc-200
                             dark:hover:border-zinc-700
                             hover:bg-zinc-50 dark:hover:bg-zinc-800/40
                             transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900
                                   dark:text-zinc-100 truncate">
                      {ex.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1
                                    flex-wrap">
                      <span className={`badge text-xs ${
                        REGION_COLORS[ex.muscle_group] ||
                        'bg-zinc-100 text-zinc-600'
                      }`}>
                        {ex.muscle_group}
                      </span>
                      {ex.primary_muscle && (
                        <span className="text-xs text-zinc-400">
                          {ex.primary_muscle}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">
                        · {ex.equipment}
                      </span>
                      {ex.equipment === 'Bodyweight' && (
                        <span className="text-xs font-medium
                                         text-green-600
                                         dark:text-green-400">
                          · BW
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSwap(ex)}
                    disabled={swapping === ex.id}
                    className="btn-primary text-xs px-3 py-1.5
                               ml-3 flex-shrink-0"
                  >
                    {swapping === ex.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white
                                      border-t-transparent rounded-full
                                      animate-spin" />
                    ) : (
                      <><RefreshCw size={12} /> Swap</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Set row ───────────────────────────────────────────────────
function SetRow({ setNum, data, onChange, onComplete, isPR }) {
  const [justCompleted, setJustCompleted] = useState(false);

  const handleComplete = () => {
    if (data.completed) return;
    setJustCompleted(true);
    onComplete();
    setTimeout(() => setJustCompleted(false), 600);
  };

  return (
    <div className={`grid grid-cols-12 gap-2 items-center
                     py-3 border-b border-zinc-50
                     dark:border-zinc-800/60 last:border-0
                     transition-all duration-300
                     ${data.completed
                       ? 'opacity-50'
                       : 'opacity-100'
                     }`}>

      {/* Set number */}
      <div className="col-span-1 flex justify-center">
        <span className={`w-5 h-5 rounded-md flex items-center
                          justify-center text-xs font-bold
                          transition-all duration-200
          ${data.completed
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
          }`}>
          {setNum}
        </span>
      </div>

      {/* Weight */}
      <div className="col-span-4">
        <div className="flex items-center gap-1 bg-zinc-50
                        dark:bg-zinc-800/60 rounded-xl px-1 py-1">
          <button
            onClick={() =>
              onChange('weight', Math.max(0, Number(data.weight) - 2.5))
            }
            className="w-7 h-7 rounded-lg hover:bg-zinc-200
                       dark:hover:bg-zinc-700 flex items-center
                       justify-center text-zinc-500 dark:text-zinc-400
                       flex-shrink-0 transition-colors"
          >
            <Minus size={11} />
          </button>
          <input
            type="number" min="0" step="0.5"
            value={data.weight}
            onChange={e => onChange('weight', e.target.value)}
            className="w-full text-center text-sm font-bold
                       bg-transparent border-none outline-none
                       text-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={() =>
              onChange('weight', Number(data.weight) + 2.5)
            }
            className="w-7 h-7 rounded-lg hover:bg-zinc-200
                       dark:hover:bg-zinc-700 flex items-center
                       justify-center text-zinc-500 dark:text-zinc-400
                       flex-shrink-0 transition-colors"
          >
            <Plus size={11} />
          </button>
        </div>
      </div>

      {/* Reps */}
      <div className="col-span-4">
        <div className="flex items-center gap-1 bg-zinc-50
                        dark:bg-zinc-800/60 rounded-xl px-1 py-1">
          <button
            onClick={() =>
              onChange('reps', Math.max(1, Number(data.reps) - 1))
            }
            className="w-7 h-7 rounded-lg hover:bg-zinc-200
                       dark:hover:bg-zinc-700 flex items-center
                       justify-center text-zinc-500 dark:text-zinc-400
                       flex-shrink-0 transition-colors"
          >
            <Minus size={11} />
          </button>
          <input
            type="number" min="1" step="1"
            value={data.reps}
            onChange={e => onChange('reps', e.target.value)}
            className="w-full text-center text-sm font-bold
                       bg-transparent border-none outline-none
                       text-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={() =>
              onChange('reps', Number(data.reps) + 1)
            }
            className="w-7 h-7 rounded-lg hover:bg-zinc-200
                       dark:hover:bg-zinc-700 flex items-center
                       justify-center text-zinc-500 dark:text-zinc-400
                       flex-shrink-0 transition-colors"
          >
            <Plus size={11} />
          </button>
        </div>
      </div>

      {/* Complete button */}
      <div className="col-span-3 flex items-center justify-center gap-1.5">
        {isPR && (
          <Trophy size={13}
            className="text-amber-500 flex-shrink-0 animate-pulse-soft" />
        )}
        <button
          onClick={handleComplete}
          disabled={data.completed}
          className={`w-9 h-9 rounded-xl flex items-center
                      justify-center transition-all duration-200
                      relative overflow-hidden
            ${data.completed
              ? 'bg-green-500 text-white cursor-default shadow-sm'
              : justCompleted
                ? 'bg-green-400 text-white scale-95'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 hover:scale-105'
            }`}
        >
          <Check size={15}
            className={`transition-transform duration-200
              ${data.completed || justCompleted
                ? 'scale-110' : 'scale-100'
              }`} />
          {/* Ripple on complete */}
          {justCompleted && (
            <span className="absolute inset-0 rounded-xl bg-green-400
                             animate-ping opacity-30" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function WorkoutSession() {
  const { workoutId } = useParams();
  const navigate      = useNavigate();
  const { notify }    = useNotifications();

  const [workout,    setWorkout]    = useState(null);
  const [session,    setSession]    = useState(null);
  const [exercises,  setExercises]  = useState([]);
  const [sets,       setSets]       = useState({});
  const [prs,        setPRs]        = useState({});
  const [timer,      setTimer]      = useState(null);
  const [elapsed,    setElapsed]    = useState(0);
  const [finishing,  setFinishing]  = useState(false);
  const [done,       setDone]       = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [swapTarget, setSwapTarget] = useState(null);
  const elapsedRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const wRes = await api.get(`/workouts/${workoutId}`);
        setWorkout(wRes.data);
        const exList = wRes.data.exercises || [];
        setExercises(exList);

        const sRes = await api.post(`/workouts/${workoutId}/start`);
        setSession(sRes.data);

        let bodyWeight = 0;
        try {
          const profileRes = await api.get('/profile');
          bodyWeight = Number(profileRes.data.weight_kg) || 0;
        } catch { /* silent */ }

        const initial = {};
        exList.forEach(ex => {
          const defaultWeight = ex.is_bodyweight && bodyWeight > 0
            ? bodyWeight : Number(ex.weight_kg) || 0;
          initial[ex.exercise_id] = Array.from(
            { length: ex.sets || 3 },
            () => ({
              weight: defaultWeight,
              reps:   Number(ex.reps) || 10,
              completed: false,
            })
          );
        });
        setSets(initial);
      } catch (e) {
        console.error(e);
        setError('Could not load workout. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [workoutId]);

  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(elapsedRef.current);
  }, []);

  const fmtTime = secs => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const updateSet = (exerciseId, idx, field, value) => {
    setSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      ),
    }));
  };

  const completeSet = async (exercise, idx) => {
    const setData = sets[exercise.exercise_id]?.[idx];
    if (!setData || setData.completed) return;
    try {
      const res = await api.put(`/workouts/sessions/${session.id}`, {
        exercise_id: exercise.exercise_id,
        set_number:  idx + 1,
        reps:        Number(setData.reps),
        weight_kg:   Number(setData.weight),
      });
      updateSet(exercise.exercise_id, idx, 'completed', true);
      if (res.data.is_pr) {
        setPRs(p => ({
          ...p,
          [`${exercise.exercise_id}_${idx}`]: true,
        }));
        notify({
          title:   'New Personal Record!',
          message: `${exercise.exercise_name} — ${setData.weight}kg × ${setData.reps}`,
          type:    'achievement',
        });
      }
      setTimer(exercise.rest_seconds || 90);
    } catch (e) { console.error(e); }
  };

  const handleSwap = swappedExercise => {
    setExercises(prev => prev.map(ex =>
      ex.exercise_id === swapTarget.exercise_id ? swappedExercise : ex
    ));
    setSets(prev => {
      const oldSets = prev[swapTarget.exercise_id] || [];
      const next    = { ...prev };
      delete next[swapTarget.exercise_id];
      next[swappedExercise.exercise_id] = oldSets.map(s => ({
        ...s, completed: false,
      }));
      return next;
    });
    setPRs(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${swapTarget.exercise_id}_`)) delete next[k];
      });
      return next;
    });
    notify({
      title:   'Exercise swapped',
      message: `${swapTarget.exercise_name} → ${swappedExercise.exercise_name}`,
      type:    'info',
    });
    setSwapTarget(null);
  };

  const finishSession = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const res = await api.post(
        `/workouts/sessions/${session.id}/complete`,
        {
          duration_minutes: Math.floor(elapsed / 60),
          calories_burned:  Math.round((elapsed / 60) * 5),
          notes:            '',
        }
      );
      if (res.data.new_achievements?.length > 0) {
        res.data.new_achievements.forEach(key => {
          notify({
            title:   'Achievement Unlocked!',
            message: key.replace(/_/g, ' '),
            type:    'achievement',
          });
        });
      } else {
        notify({
          title:   'Workout Complete!',
          message: `${workout?.name} — ${Math.floor(elapsed / 60)} min`,
          type:    'success',
        });
      }
      clearInterval(elapsedRef.current);
      setDone(true);
    } catch (e) { console.error(e); }
    finally { setFinishing(false); }
  };

  const allSets   = Object.values(sets).flat();
  const doneSets  = allSets.filter(s => s.completed).length;
  const totalSets = allSets.length;
  const progress  = totalSets > 0
    ? Math.round((doneSets / totalSets) * 100) : 0;
  const totalVol  = allSets
    .filter(s => s.completed)
    .reduce((acc, s) => acc + Number(s.weight) * Number(s.reps), 0);
  const prCount   = Object.keys(prs).length;

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="skeleton h-12 rounded-2xl" />
        {[1,2,3].map(i => (
          <div key={i} className="skeleton h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20
                        rounded-2xl flex items-center justify-center
                        mx-auto">
          <X size={24} className="text-red-500" />
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          {error}
        </p>
        <button onClick={() => navigate('/workouts')}
          className="btn-secondary">
          Back to Workouts
        </button>
      </div>
    );
  }

  // ── Session complete ──────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-lg mx-auto py-10 animate-fade-in">
        {/* Celebration header */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-5">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full
                            bg-green-400/20 animate-ping" />
            <div className="absolute inset-2 rounded-full
                            bg-green-400/15" />
            <div className="relative w-24 h-24 bg-gradient-to-br
                            from-green-400 to-emerald-600
                            rounded-full flex items-center
                            justify-center shadow-[0_8px_24px_0_rgb(16_185_129_/_0.4)]">
              <CheckCircle2 size={42} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900
                         dark:text-zinc-100 mb-2">
            Workout Complete!
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            You crushed{' '}
            <span className="font-semibold text-zinc-700
                             dark:text-zinc-300">
              {workout?.name}
            </span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {
              label: 'Duration',
              value:  fmtTime(elapsed),
              icon:   Timer,
              color:  'text-brand-500',
              bg:     'bg-brand-50 dark:bg-brand-900/20',
            },
            {
              label: 'Volume',
              value: `${Math.round(totalVol)}kg`,
              icon:  BarChart2,
              color: 'text-green-500',
              bg:    'bg-green-50 dark:bg-green-900/20',
            },
            {
              label: 'New PRs',
              value:  prCount,
              icon:   Trophy,
              color:  'text-amber-500',
              bg:     'bg-amber-50 dark:bg-amber-900/20',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label}
              className="card p-4 text-center">
              <div className={`w-9 h-9 ${bg} rounded-xl
                               flex items-center justify-center
                               mx-auto mb-2`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-xl font-bold text-zinc-900
                             dark:text-zinc-100 tabular-nums">
                {value}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* PR banner */}
        {prCount > 0 && (
          <div className="card p-4 mb-5 bg-gradient-to-r
                          from-amber-50 to-orange-50
                          dark:from-amber-900/20 dark:to-orange-900/20
                          border-amber-200 dark:border-amber-800/60
                          animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br
                              from-amber-400 to-amber-600
                              rounded-xl flex items-center
                              justify-center flex-shrink-0
                              shadow-[0_2px_8px_0_rgb(245_158_11_/_0.4)]">
                <Trophy size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-700
                               dark:text-amber-300">
                  {prCount} new personal record
                  {prCount > 1 ? 's' : ''} set!
                </p>
                <p className="text-xs text-amber-600/70
                               dark:text-amber-400/70">
                  Check your progress page to see updated charts
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => navigate('/history')}
            className="btn-secondary flex-1">
            View history
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="btn-primary flex-1 flex items-center
                       justify-center gap-2">
            <Zap size={15} />
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Active session ────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in pb-8">

      {/* ── Session header ── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/workouts')}
          className="btn-ghost p-2">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">
            {workout?.name}
          </h1>
          <p className="page-subtitle">
            {workout?.split_type || 'Custom'}
            {' · '}{exercises.length} exercises
          </p>
        </div>
        {/* Live timer */}
        <div className="flex items-center gap-2 px-3 py-1.5
                        bg-brand-50 dark:bg-brand-900/20
                        rounded-xl flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500
                           animate-pulse" />
          <span className="text-sm font-mono font-bold text-brand-600
                           dark:text-brand-400 tabular-nums">
            {fmtTime(elapsed)}
          </span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-700
                             dark:text-zinc-300">
              {doneSets} / {totalSets} sets
            </span>
            <span className="text-xs text-zinc-400">completed</span>
          </div>
          <span className={`text-xs font-bold tabular-nums
            ${progress === 100
              ? 'text-green-500'
              : 'text-brand-500'
            }`}>
            {progress}%
          </span>
        </div>
        {/* Segmented progress bar */}
        <div className="flex gap-0.5">
          {Array.from({ length: Math.max(totalSets, 1) }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-all duration-300
                ${i < doneSets
                  ? progress === 100
                    ? 'bg-green-500'
                    : 'bg-brand-500'
                  : 'bg-zinc-100 dark:bg-zinc-800'
                }`}
              style={{
                transitionDelay: `${i * 20}ms`,
              }}
            />
          ))}
        </div>

        {/* Mini stats row */}
        {doneSets > 0 && (
          <div className="flex items-center gap-4 mt-3 pt-2.5
                          border-t border-zinc-50 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs
                            text-zinc-500 dark:text-zinc-400">
              <Flame size={11} className="text-orange-400" />
              <span className="tabular-nums">
                {Math.round(totalVol)}kg volume
              </span>
            </div>
            {prCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs
                              text-amber-500 font-medium">
                <Trophy size={11} />
                {prCount} PR{prCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Exercise cards ── */}
      {exercises.length > 0 ? (
        exercises.map((exercise, exIdx) => {
          const exSets  = sets[exercise.exercise_id] || [];
          const allDone = exSets.length > 0 &&
                          exSets.every(s => s.completed);
          const doneCnt = exSets.filter(s => s.completed).length;
          const vol     = exSets
            .filter(s => s.completed)
            .reduce((acc, s) =>
              acc + Number(s.weight) * Number(s.reps), 0
            );

          return (
            <div
              key={exercise.exercise_id}
              className={`card overflow-hidden transition-all duration-300
                ${allDone
                  ? 'border-green-200 dark:border-green-800/60'
                  : ''
                }`}
            >
              {/* Exercise header */}
              <div className={`px-5 py-4 border-b border-zinc-50
                               dark:border-zinc-800/60
                               transition-colors duration-300
                ${allDone
                  ? 'bg-green-50/80 dark:bg-green-900/10'
                  : ''
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Exercise number or check */}
                    <div className={`w-8 h-8 rounded-xl flex items-center
                                     justify-center flex-shrink-0
                                     font-bold text-sm transition-all
                                     duration-300
                      ${allDone
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}>
                      {allDone
                        ? <Check size={15} />
                        : exIdx + 1
                      }
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-zinc-900
                                     dark:text-zinc-100 truncate">
                        {exercise.exercise_name}
                      </p>
                      <div className="flex items-center gap-1.5
                                      flex-wrap mt-0.5">
                        <span className="text-xs text-zinc-400">
                          {exercise.muscle_group}
                          {exercise.equipment
                            ? ` · ${exercise.equipment}` : ''}
                        </span>
                        {exercise.is_bodyweight && (
                          <span className="px-1.5 py-0.5 rounded-md
                                           text-2xs font-medium
                                           bg-green-100 text-green-700
                                           dark:bg-green-900/20
                                           dark:text-green-400">
                            BW
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2
                                  flex-shrink-0">
                    {/* Sets counter */}
                    <span className="text-xs font-medium
                                     text-zinc-400 tabular-nums">
                      {doneCnt}/{exSets.length}
                    </span>

                    {/* Volume */}
                    {vol > 0 && (
                      <span className="text-xs text-brand-500
                                       font-medium hidden sm:block
                                       tabular-nums">
                        {Math.round(vol)}kg
                      </span>
                    )}

                    {/* Swap */}
                    {!allDone && (
                      <button
                        onClick={() => setSwapTarget(exercise)}
                        className="btn-ghost p-1.5 text-zinc-400
                                   hover:text-brand-500
                                   hover:bg-brand-50
                                   dark:hover:bg-brand-900/20
                                   rounded-lg"
                        title="Swap exercise"
                      >
                        <RefreshCw size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-5 pt-3 pb-1">
                <span className="col-span-1 text-xs text-zinc-400
                                  text-center font-medium">
                  #
                </span>
                <span className="col-span-4 text-xs text-zinc-400
                                  text-center font-medium">
                  Weight kg
                </span>
                <span className="col-span-4 text-xs text-zinc-400
                                  text-center font-medium">
                  Reps
                </span>
                <span className="col-span-3 text-xs text-zinc-400
                                  text-center font-medium">
                  Done
                </span>
              </div>

              {/* Sets */}
              <div className="px-5 pb-3">
                {exSets.map((setData, idx) => (
                  <SetRow
                    key={idx}
                    setNum={idx + 1}
                    data={setData}
                    isPR={prs[`${exercise.exercise_id}_${idx}`]}
                    onChange={(field, val) =>
                      updateSet(exercise.exercise_id, idx, field, val)
                    }
                    onComplete={() => completeSet(exercise, idx)}
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="card p-12 text-center">
          <Dumbbell size={36}
            className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-gray-400 text-sm mb-4">
            This workout has no exercises.
          </p>
          <button onClick={() => navigate('/workouts')}
            className="btn-secondary">
            Back to Workouts
          </button>
        </div>
      )}

      {/* ── Finish button ── */}
      <div className="sticky bottom-4">
        <button
          onClick={finishSession}
          disabled={finishing || doneSets === 0}
          className={`w-full py-4 rounded-2xl font-semibold text-sm
                      flex items-center justify-center gap-2
                      transition-all duration-200
                      shadow-[0_4px_20px_0_rgb(0_0_0_/_0.15)]
            ${doneSets === 0
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:-translate-y-0.5 hover:shadow-[0_6px_24px_0_rgb(99_102_241_/_0.4)] active:translate-y-0'
            }`}
        >
          {finishing ? (
            <>
              <div className="w-4 h-4 border-2 border-white
                              border-t-transparent rounded-full
                              animate-spin" />
              Saving...
            </>
          ) : doneSets === 0 ? (
            <>
              <Square size={15} />
              Complete a set to finish
            </>
          ) : (
            <>
              <Square size={15} />
              Finish Workout
              {doneSets > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/20
                                  rounded-lg text-xs font-bold">
                  {progress}%
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Rest timer */}
      {timer !== null && (
        <RestTimer
          seconds={timer}
          onDone={() => setTimer(null)}
        />
      )}

      {/* Swap modal */}
      {swapTarget && session && (
        <SwapModal
          exercise={swapTarget}
          sessionId={session.id}
          onSwap={handleSwap}
          onClose={() => setSwapTarget(null)}
        />
      )}
    </div>
  );
}