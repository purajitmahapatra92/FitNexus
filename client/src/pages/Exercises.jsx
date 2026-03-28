import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import api from '../services/api';

const MUSCLES = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];
const EQUIPMENT = ['All', 'Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Other'];
const DIFFICULTY = ['All', 'beginner', 'intermediate', 'advanced'];
const MOVEMENT_TYPES = [
  'All',
  'Compound (Free)',
  'Compound (Dumbbell)',
  'Compound (Machine)',
  'Compound (Bodyweight)',
  'Isolation (Free)',
  'Isolation (Cable)',
  'Isolation (Machine)',
];

const REGION_COLORS = {
  Chest: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  Back: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  Shoulders: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  Arms: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300' },
  Legs: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  Core: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  Cardio: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

const DIFF_COLORS = {
  beginner: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  intermediate: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  advanced: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

const MOVEMENT_COLORS = {
  'Compound (Free)': { bg: 'bg-brand-100 dark:bg-brand-900/30', text: 'text-brand-700 dark:text-brand-300' },
  'Compound (Dumbbell)': { bg: 'bg-brand-100 dark:bg-brand-900/30', text: 'text-brand-700 dark:text-brand-300' },
  'Compound (Machine)': { bg: 'bg-brand-100 dark:bg-brand-900/30', text: 'text-brand-700 dark:text-brand-300' },
  'Compound (Bodyweight)': { bg: 'bg-brand-100 dark:bg-brand-900/30', text: 'text-brand-700 dark:text-brand-300' },
  'Isolation (Free)': { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' },
  'Isolation (Cable)': { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' },
  'Isolation (Machine)': { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' },
};

function Tag({ label, bg, text }) {
  if (!label) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                      text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-zinc-400 w-20 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ── Exercise card ─────────────────────────────────────────────
function ExerciseCard({ ex, onClick }) {
  const rc = REGION_COLORS[ex.muscle_group] || { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' };
  const dc = DIFF_COLORS[ex.difficulty] || { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' };
  const mc = MOVEMENT_COLORS[ex.movement_type] || { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' };

  return (
    <button
      onClick={onClick}
      className="card group p-5 text-left hover:shadow-card-hover
                 transition-all w-full flex flex-col gap-2.5"
    >
      {/* Badges row — region + difficulty */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tag label={ex.muscle_group} bg={rc.bg} text={rc.text} />
        <Tag label={ex.difficulty} bg={dc.bg} text={dc.text} />
      </div>

      {/* Exercise name */}
      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
        {ex.name}
      </p>

      {/* Info rows */}
      <div className="space-y-1.5">
        <InfoRow label="Equipment:">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
            {ex.equipment}
          </span>
        </InfoRow>

        <InfoRow label="Primary:">
          <span className={`text-xs font-semibold ${rc.text}`}>
            {ex.primary_muscle || ex.muscle_group}
          </span>
        </InfoRow>

        <InfoRow label="Secondary:">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {ex.secondary_muscles?.length > 0
              ? ex.secondary_muscles.join(', ')
              : 'None'}
          </span>
        </InfoRow>
      </div>

      {/* Movement type badge */}
      {ex.movement_type && (
        <div className="pt-2 border-t border-zinc-50 dark:border-zinc-800">
          <Tag label={ex.movement_type} bg={mc.bg} text={mc.text} />
        </div>
      )}
    </button>
  );
}

// ── Detail modal ──────────────────────────────────────────────
function ExerciseModal({ ex, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!ex) return null;

  const rc = REGION_COLORS[ex.muscle_group] || { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' };
  const dc = DIFF_COLORS[ex.difficulty] || { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' };
  const mc = MOVEMENT_COLORS[ex.movement_type] || { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400' };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '28rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--modal-bg, #ffffff)',
        }}
        className="dark:[--modal-bg:#141418] rounded-2xl p-6
                   border border-gray-100 dark:border-gray-800
                   shadow-[0_24px_48px_0_rgba(0,0,0,0.25)]
                   animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 pr-3">
            <h2 className="text-lg font-bold text-zinc-900
                           dark:text-zinc-100 mb-2">
              {ex.name}
            </h2>
            <div className="flex gap-2 flex-wrap">
              <Tag label={ex.muscle_group} bg={rc.bg} text={rc.text} />
              <Tag label={ex.difficulty} bg={dc.bg} text={dc.text} />
              {ex.movement_type && (
                <Tag label={ex.movement_type} bg={mc.bg} text={mc.text} />
              )}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase
                           tracking-wide mb-2">
              Equipment
            </p>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {ex.equipment}
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase
                           tracking-wide mb-3">
              Muscles targeted
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500
                                  dark:text-zinc-400">
                  Region
                </span>
                <Tag label={ex.muscle_group} bg={rc.bg} text={rc.text} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500
                                  dark:text-zinc-400">
                  Primary muscle
                </span>
                <span className={`text-xs font-bold ${rc.text}`}>
                  {ex.primary_muscle || ex.muscle_group}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-zinc-500
                                  dark:text-zinc-400 flex-shrink-0">
                  Secondary muscles
                </span>
                {ex.secondary_muscles?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {ex.secondary_muscles.map(m => (
                      <span key={m}
                        className="px-2 py-0.5 rounded-full text-xs
                                   font-medium bg-zinc-200 dark:bg-zinc-700
                                   text-zinc-700 dark:text-zinc-300">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400">None</span>
                )}
              </div>
            </div>
          </div>

          {ex.movement_type && (
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase
                             tracking-wide mb-2">
                Movement type
              </p>
              <Tag label={ex.movement_type} bg={mc.bg} text={mc.text} />
            </div>
          )}

          {ex.instructions && (
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase
                             tracking-wide mb-2">
                How to perform
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300
                             leading-relaxed">
                {ex.instructions}
              </p>
            </div>
          )}
        </div>

        <button onClick={onClose} className="btn-secondary w-full mt-5">
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('All');
  const [equipment, setEquipment] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [movementType, setMovementType] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchExercises(); }, []);

  useEffect(() => {
    let result = [...exercises];
    if (search)
      result = result.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.muscle_group.toLowerCase().includes(search.toLowerCase()) ||
        e.primary_muscle?.toLowerCase().includes(search.toLowerCase()) ||
        e.equipment.toLowerCase().includes(search.toLowerCase()) ||
        e.secondary_muscles?.some(s =>
          s.toLowerCase().includes(search.toLowerCase())
        )
      );
    if (muscle !== 'All')
      result = result.filter(e => e.muscle_group === muscle);
    if (equipment !== 'All')
      result = result.filter(e => e.equipment === equipment);
    if (difficulty !== 'All')
      result = result.filter(e => e.difficulty === difficulty);
    if (movementType !== 'All')
      result = result.filter(e => e.movement_type === movementType);
    setFiltered(result);
  }, [search, muscle, equipment, difficulty, movementType, exercises]);

  const fetchExercises = async () => {
    try {
      const { data } = await api.get('/exercises');
      setExercises(data);
      setFiltered(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const clearAll = () => {
    setSearch(''); setMuscle('All'); setEquipment('All');
    setDifficulty('All'); setMovementType('All');
  };

  const activeFilterCount = [
    muscle !== 'All', equipment !== 'All',
    difficulty !== 'All', movementType !== 'All',
  ].filter(Boolean).length;

  return (
    <div className="space-y-5 animate-fade-in">

      <div>
        <h1 className="page-title">Exercise Library</h1>
        <p className="page-subtitle">
          {exercises.length} exercises across 7 muscle groups.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2
                     text-zinc-400 pointer-events-none" />
        <input className="input pl-10 pr-10"
          placeholder="Search by name, muscle, equipment…"
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-zinc-400 hover:text-zinc-600">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Muscle tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {MUSCLES.map(m => (
          <button key={m} onClick={() => setMuscle(m)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium
                        whitespace-nowrap transition-all border flex-shrink-0
              ${muscle === m
                ? 'bg-brand-500 border-brand-500 text-white'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}>
            {m}
          </button>
        ))}
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between">
        <button onClick={() => setShowFilters(s => !s)}
          className="flex items-center gap-1.5 text-sm text-zinc-500
                     dark:text-zinc-400 hover:text-zinc-700
                     dark:hover:text-zinc-200 transition-colors">
          {showFilters ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          More filters
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs
                             bg-brand-500 text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button onClick={clearAll}
              className="text-xs text-brand-500 hover:text-brand-600">
              Clear all
            </button>
          )}
          <span className="text-xs text-zinc-400">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4
                        bg-zinc-50 dark:bg-zinc-900 rounded-xl border
                        border-zinc-100 dark:border-zinc-800 animate-slide-up">
          <div>
            <label className="label text-xs">Equipment</label>
            <select className="input text-sm py-2" value={equipment}
              onChange={e => setEquipment(e.target.value)}>
              {EQUIPMENT.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Difficulty</label>
            <select className="input text-sm py-2" value={difficulty}
              onChange={e => setDifficulty(e.target.value)}>
              {DIFFICULTY.map(d => (
                <option key={d} value={d} className="capitalize">{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Movement type</label>
            <select className="input text-sm py-2" value={movementType}
              onChange={e => setMovementType(e.target.value)}>
              {MOVEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Active pills */}
      {activeFilterCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[
            { val: muscle, clear: () => setMuscle('All') },
            { val: equipment, clear: () => setEquipment('All') },
            { val: difficulty, clear: () => setDifficulty('All') },
            { val: movementType, clear: () => setMovementType('All') },
          ].filter(f => f.val !== 'All').map(f => (
            <span key={f.val}
              className="flex items-center gap-1 px-3 py-1 rounded-full
                         text-xs font-medium bg-brand-100 text-brand-700
                         dark:bg-brand-900/30 dark:text-brand-300">
              {f.val}
              <button onClick={f.clear}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up stagger-2">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="card h-48 skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Dumbbell size={40}
            className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
          <p className="font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            No exercises found
          </p>
          <p className="text-sm text-zinc-400 mb-4">
            Try adjusting your search or filters.
          </p>
          <button onClick={clearAll} className="btn-secondary text-sm">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up stagger-2">
          {filtered.map(ex => (
            <ExerciseCard key={ex.id} ex={ex}
              onClick={() => setSelected(ex)} />
          ))}
        </div>
      )}

      <ExerciseModal ex={selected} onClose={() => setSelected(null)} />
    </div>
  );
}