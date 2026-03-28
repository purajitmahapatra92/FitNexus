import { useState, useEffect } from 'react';
import { Plus, X, Dumbbell, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import api from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EVENT_COLORS = {
  workout: { bg: 'bg-brand-500', light: 'bg-brand-50 dark:bg-brand-900/20', text: 'text-brand-700 dark:text-brand-300', dot: 'bg-brand-500' },
  rest: { bg: 'bg-zinc-400', light: 'bg-zinc-50 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', dot: 'bg-zinc-400' },
  cardio: { bg: 'bg-green-500', light: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  custom: { bg: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
};

// Get the Monday of the week containing a given date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getEventDateStr(dateValue) {
  if (!dateValue) return '';
  if (dateValue.includes('T')) {
    return toDateStr(new Date(dateValue));
  }
  return dateValue.slice(0, 10);
}

function fmtMonthYear(date) {
  return date.toLocaleDateString('en', { month: 'long', year: 'numeric' });
}

function fmtDayNum(date) {
  return date.getDate();
}

function isToday(date) {
  return toDateStr(date) === toDateStr(new Date());
}

// ── Add event modal ───────────────────────────────────────────
function AddEventModal({ date, workouts, onConfirm, onClose }) {
  const [form, setForm] = useState({
    title: '',
    event_type: 'workout',
    workout_id: '',
    color: '#6366f1',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const EVENT_TYPES = [
    { key: 'workout', label: 'Workout' },
    { key: 'rest', label: 'Rest Day' },
    { key: 'cardio', label: 'Cardio' },
    { key: 'custom', label: 'Custom' },
  ];

  const TYPE_COLORS = {
    workout: '#6366f1',
    rest: '#9ca3af',
    cardio: '#10b981',
    custom: '#8b5cf6',
  };

  const handleTypeChange = type => {
    setForm(f => ({
      ...f,
      event_type: type,
      color: TYPE_COLORS[type],
      title: type === 'rest' ? 'Rest Day' : f.title,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const title = form.event_type === 'workout' && form.workout_id
      ? workouts.find(w => w.id === form.workout_id)?.name || form.title
      : form.title;
    try {
      await onConfirm({
        ...form,
        title: title || form.event_type,
        event_date: date,
        workout_id: (form.event_type === 'workout' && form.workout_id) ? form.workout_id : null
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add event');
    } finally {
      if (document.body.contains(e.target)) setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50
                 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-sm animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Add to schedule
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {new Date(date + 'T00:00:00').toLocaleDateString('en', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event type */}
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map(({ key, label }) => (
                <button
                  key={key} type="button"
                  onClick={() => handleTypeChange(key)}
                  className={`py-2 rounded-xl text-xs font-medium
                              border transition-all
                    ${form.event_type === key
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Workout picker — only for workout type */}
          {form.event_type === 'workout' && workouts.length > 0 && (
            <div>
              <label className="label">Select workout</label>
              <select className="input" value={form.workout_id}
                onChange={e =>
                  setForm(f => ({ ...f, workout_id: e.target.value }))
                }>
                <option value="">Custom title below</option>
                {workouts.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title — shown when not picking a workout */}
          {(form.event_type !== 'workout' || !form.workout_id) && (
            <div>
              <label className="label">Title</label>
              <input className="input"
                placeholder={
                  form.event_type === 'rest' ? 'Rest Day' :
                    form.event_type === 'cardio' ? 'Morning run' :
                      'Event title'
                }
                value={form.title}
                onChange={e =>
                  setForm(f => ({ ...f, title: e.target.value }))
                }
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" placeholder="Any notes..."
              value={form.notes}
              onChange={e =>
                setForm(f => ({ ...f, notes: e.target.value }))
              }
            />
          </div>

          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add to schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Day column ────────────────────────────────────────────────
function DayColumn({
  dayName, shortName, date, events,
  isCurrentDay, onAdd, onDelete, compact,
}) {
  const dateStr = toDateStr(date);
  const dayEvents = events.filter(e => getEventDateStr(e.event_date) === dateStr);

  return (
    <div className={`flex flex-col min-h-0
      ${compact ? 'min-w-[120px]' : 'flex-1'}`}>

      {/* Day header */}
      <div className={`text-center py-3 rounded-xl mb-2
        ${isCurrentDay
          ? 'bg-brand-500'
          : 'bg-zinc-50 dark:bg-zinc-800'
        }`}>
        <p className={`text-xs font-semibold uppercase tracking-wide
          ${isCurrentDay
            ? 'text-white/80'
            : 'text-zinc-400 dark:text-zinc-500'
          }`}>
          {compact ? shortName : dayName}
        </p>
        <p className={`text-xl font-bold mt-0.5
          ${isCurrentDay
            ? 'text-white'
            : 'text-zinc-900 dark:text-zinc-100'
          }`}>
          {fmtDayNum(date)}
        </p>
      </div>

      {/* Events */}
      <div className="flex-1 space-y-1.5 min-h-[120px]">
        {dayEvents.map(ev => {
          const colors = EVENT_COLORS[ev.event_type] || EVENT_COLORS.custom;
          return (
            <div
              key={ev.id}
              className={`group relative px-2.5 py-2 rounded-xl
                          text-xs font-medium transition-all
                          ${colors.light} ${colors.text}`}
              style={{
                borderLeft: `3px solid ${ev.color || '#6366f1'}`,
              }}
            >
              <p className="truncate pr-4 leading-snug">{ev.title}</p>
              {ev.notes && (
                <p className="truncate text-xs opacity-60 mt-0.5">
                  {ev.notes}
                </p>
              )}
              {/* Delete on hover */}
              <button
                onClick={() => onDelete(ev.id)}
                className="absolute top-1.5 right-1.5 opacity-0
                           group-hover:opacity-100 transition-opacity
                           w-4 h-4 rounded flex items-center justify-center
                           hover:bg-black/10"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}

        {/* Add button */}
        <button
          onClick={() => onAdd(dateStr)}
          className="w-full py-2 rounded-xl border border-dashed
                     border-zinc-200 dark:border-zinc-700
                     text-zinc-300 dark:text-zinc-600
                     hover:border-brand-300 dark:hover:border-brand-700
                     hover:text-brand-400 dark:hover:text-brand-500
                     transition-colors flex items-center justify-center"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Week summary bar ──────────────────────────────────────────
function WeekSummary({ weekDates, events }) {
  const stats = weekDates.reduce((acc, date) => {
    const dateStr = toDateStr(date);
    const dayEvents = events.filter(e => getEventDateStr(e.event_date) === dateStr);
    dayEvents.forEach(ev => {
      if (ev.event_type === 'workout') acc.workouts++;
      if (ev.event_type === 'rest') acc.rest++;
      if (ev.event_type === 'cardio') acc.cardio++;
    });
    return acc;
  }, { workouts: 0, rest: 0, cardio: 0 });

  const total = stats.workouts + stats.rest + stats.cardio;
  if (total === 0) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs font-semibold text-zinc-500
                       dark:text-zinc-400 uppercase tracking-wide">
          This week
        </p>
        <div className="flex items-center gap-4">
          {[
            { label: 'Workouts', val: stats.workouts, color: 'text-brand-500' },
            { label: 'Cardio', val: stats.cardio, color: 'text-green-500' },
            { label: 'Rest', val: stats.rest, color: 'text-zinc-400' },
          ].filter(s => s.val > 0).map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={`text-lg font-bold ${color}`}>{val}</p>
              <p className="text-xs text-zinc-400">{label}</p>
            </div>
          ))}
        </div>

        {/* 7-day dot strip */}
        <div className="flex items-center gap-1.5">
          {weekDates.map((date, i) => {
            const dateStr = toDateStr(date);
            const dayEvents = events.filter(
              e => getEventDateStr(e.event_date) === dateStr
            );
            const type = dayEvents[0]?.event_type;
            const colors = type ? EVENT_COLORS[type] : null;
            return (
              <div
                key={i}
                className={`w-5 h-5 rounded-full flex items-center
                             justify-center transition-all
                  ${colors
                    ? colors.bg + ' text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                title={SHORT[i]}
              >
                {type === 'workout' && (
                  <Dumbbell size={10} className="text-white" />
                )}
                {type === 'rest' && (
                  <Check size={10} className="text-white" />
                )}
                {type === 'cardio' && (
                  <span className="text-white text-xs font-bold">C</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function WeeklySchedule() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [events, setEvents] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [addingFor, setAddingFor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Build array of 7 dates for this week (Mon–Sun)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthLabel = (() => {
    const first = weekDates[0];
    const last = weekDates[6];
    if (first.getMonth() === last.getMonth()) {
      return fmtMonthYear(first);
    }
    return `${first.toLocaleDateString('en', { month: 'short' })} – ${fmtMonthYear(last)}`;
  })();

  useEffect(() => {
    fetchData();
  }, [weekStart]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const monthStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')
        }`;
      const [ev, wo] = await Promise.all([
        api.get(`/calendar?month=${monthStr}`),
        api.get('/workouts'),
      ]);
      // Also fetch next month if week spans two months
      const lastDay = weekDates[6];
      if (lastDay.getMonth() !== weekStart.getMonth()) {
        const nextMonth = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')
          }`;
        const ev2 = await api.get(`/calendar?month=${nextMonth}`);
        setEvents([...ev.data, ...ev2.data]);
      } else {
        setEvents(ev.data);
      }
      setWorkouts(wo.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, +7));
  const goToday = () => setWeekStart(getWeekStart(new Date()));

  const addEvent = async formData => {
    try {
      const { data } = await api.post('/calendar', formData);
      setEvents(e => [...e, data]);
      setAddingFor(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteEvent = async id => {
    try {
      await api.delete(`/calendar/${id}`);
      setEvents(e => e.filter(ev => ev.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Weekly Schedule</h1>
          <p className="page-subtitle">
            Plan your training week at a glance.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="btn-secondary text-sm">
            Today
          </button>
          <button onClick={prevWeek} className="btn-ghost p-2">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-zinc-700
                           dark:text-zinc-300 min-w-[160px] text-center">
            {monthLabel}
          </span>
          <button onClick={nextWeek} className="btn-ghost p-2">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── Week summary ── */}
      <WeekSummary weekDates={weekDates} events={events} />

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(EVENT_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400
                             capitalize">
              {type}
            </span>
          </div>
        ))}
      </div>

      {/* ── Week grid ── */}
      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="card h-48 skeleton" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-7 gap-3">
            {weekDates.map((date, i) => (
              <DayColumn
                key={i}
                dayName={DAYS[i]}
                shortName={SHORT[i]}
                date={date}
                events={events}
                isCurrentDay={isToday(date)}
                onAdd={setAddingFor}
                onDelete={deleteEvent}
                compact={false}
              />
            ))}
          </div>

          {/* Mobile — horizontal scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 pb-2"
              style={{ minWidth: `${7 * 128}px` }}>
              {weekDates.map((date, i) => (
                <DayColumn
                  key={i}
                  dayName={DAYS[i]}
                  shortName={SHORT[i]}
                  date={date}
                  events={events}
                  isCurrentDay={isToday(date)}
                  onAdd={setAddingFor}
                  onDelete={deleteEvent}
                  compact={true}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Quick tips if empty ── */}
      {!loading && events.length === 0 && (
        <div className="card p-8 text-center">
          <Dumbbell size={36}
            className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
          <p className="font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            No events this week
          </p>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">
            Click the + button on any day to schedule a workout,
            rest day or cardio session.
          </p>
        </div>
      )}

      {/* ── Add event modal ── */}
      {addingFor && (
        <AddEventModal
          date={addingFor}
          workouts={workouts}
          onConfirm={addEvent}
          onClose={() => setAddingFor(null)}
        />
      )}
    </div>
  );
}