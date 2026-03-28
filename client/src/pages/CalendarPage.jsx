import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';

const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [events,  setEvents]  = useState([]);
  const [showForm,setShowForm]= useState(false);
  const [selected,setSelected]= useState(null);
  const [form, setForm] = useState({ title:'', event_type:'workout', color:'#6366f1', notes:'' });

  const year  = current.getFullYear();
  const month = current.getMonth();

  useEffect(() => { fetchEvents(); }, [year, month]);

  const fetchEvents = async () => {
    try {
      const monthStr = `${year}-${String(month+1).padStart(2,'0')}`;
      const { data } = await api.get(`/calendar?month=${monthStr}`);
      setEvents(data);
    } catch(e){ console.error(e); }
  };

  const createEvent = async e => {
    e.preventDefault();
    if (!selected) return;
    try {
      await api.post('/calendar', { ...form, event_date: selected });
      setShowForm(false);
      setForm({ title:'', event_type:'workout', color:'#6366f1', notes:'' });
      fetchEvents();
    } catch(e){ console.error(e); }
  };

  const deleteEvent = async id => {
    try { await api.delete(`/calendar/${id}`); fetchEvents(); }
    catch(e){ console.error(e); }
  };

  // Build calendar grid
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getDateStr = d => d ? format(new Date(year, month, d), 'yyyy-MM-dd') : null;
  
  const getEventDateStr = dateValue => {
    if (!dateValue) return null;
    if (dateValue.includes('T')) {
      return format(new Date(dateValue), 'yyyy-MM-dd');
    }
    return dateValue.slice(0, 10);
  };
  
  const eventsForDay = d => events.filter(e => getEventDateStr(e.event_date) === getDateStr(d));

  const today = new Date();
  const isToday = d => d && today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;

  const monthName = current.toLocaleString('default',{month:'long',year:'numeric'});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Plan and track your workouts and events.</p>
        </div>
      </div>

      <div className="card p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={()=>setCurrent(new Date(year,month-1,1))} className="btn-ghost p-2">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{monthName}</h2>
          <button onClick={()=>setCurrent(new Date(year,month+1,1))} className="btn-ghost p-2">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map(d=>(
            <div key={d} className="text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const dayEvents = eventsForDay(d);
            return (
              <div key={i}
                onClick={() => { if(d){ setSelected(getDateStr(d)); setShowForm(true); }}}
                className={`min-h-[72px] p-1.5 rounded-xl transition-all cursor-pointer
                  ${d ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800' : ''}
                  ${isToday(d) ? 'bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500' : ''}
                  ${!d ? 'opacity-0 pointer-events-none' : ''}`}>
                {d && (
                  <>
                    <p className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday(d) ? 'bg-brand-500 text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {d}
                    </p>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0,3).map(ev=>(
                        <div key={ev.id}
                          className="flex items-center justify-between text-xs rounded px-1 py-0.5 text-white truncate"
                          style={{ backgroundColor: ev.color || '#6366f1' }}>
                          <span className="truncate">{ev.title}</span>
                          <button onClick={e=>{e.stopPropagation();deleteEvent(ev.id)}}
                            className="ml-1 opacity-70 hover:opacity-100 flex-shrink-0">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-xs text-zinc-400 pl-1">+{dayEvents.length-3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add event modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="card p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Add event — {selected}
              </h3>
              <button onClick={()=>setShowForm(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createEvent} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input required className="input" placeholder="e.g. Push Day"
                  value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.event_type}
                  onChange={e=>setForm(f=>({...f,event_type:e.target.value}))}>
                  <option value="workout">Workout</option>
                  <option value="rest">Rest Day</option>
                  <option value="cardio">Cardio</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="label">Color</label>
                <input type="color" className="input h-10 p-1 cursor-pointer"
                  value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">Add event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}