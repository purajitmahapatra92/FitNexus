import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Pin, StickyNote,
  Search, X, PinOff,
} from 'lucide-react';
import api from '../services/api';

const NOTE_COLORS = [
  { hex:'#fef08a', name:'Yellow'  },
  { hex:'#bbf7d0', name:'Mint'    },
  { hex:'#bfdbfe', name:'Sky'     },
  { hex:'#fecaca', name:'Rose'    },
  { hex:'#e9d5ff', name:'Lavender'},
  { hex:'#fed7aa', name:'Peach'   },
  { hex:'#f5f5f4', name:'Stone'   },
];

// ── Luminance helper ──────────────────────────────────────────
function isLight(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return (r*299 + g*587 + b*114) / 1000 > 128;
}

// ── Debounce hook ─────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ── Column count hook ─────────────────────────────────────────
function useColumnCount() {
  const [cols, setCols] = useState(4);
  
  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth < 640) setCols(1); // sm
      else if (window.innerWidth < 1024) setCols(2); // lg
      else if (window.innerWidth < 1280) setCols(3); // xl
      else setCols(4);
    };
    
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);
  
  return cols;
}

// ── Note card ─────────────────────────────────────────────────
function NoteCard({ note, isEditing, onEdit, onBlur,
                    onUpdate, onDelete, onPin, index }) {
  const [title,   setTitle]   = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [visible, setVisible] = useState(false);
  const titleRef = useRef(null);

  // Staggered entrance
  useEffect(() => {
    const t = setTimeout(() => setVisible(true),
      Math.min(index * 60, 360)
    );
    return () => clearTimeout(t);
  }, [index]);

  // Focus title on new note
  useEffect(() => {
    if (isEditing && title === 'New Note') {
      titleRef.current?.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    onUpdate({ title, content });
    onBlur();
  };

  const textColor  = isLight(note.color) ? '#1f2937' : '#f9fafb';
  const mutedColor = isLight(note.color)
    ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)';
  const wordCount  = content.trim()
    ? content.trim().split(/\s+/).length : 0;

  return (
    <div
      className={`group relative rounded-2xl flex flex-col
                  cursor-pointer select-none
                  transition-all duration-500 ease-out
                  hover:-translate-y-1
        ${visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6'
        }
        ${note.is_pinned
          ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0c0c0f]'
          : ''
        }`}
      style={{
        backgroundColor: note.color,
        minHeight:       '180px',
        boxShadow: isEditing
          ? `0 8px 30px 0 rgba(0,0,0,0.15), 0 0 0 2px ${note.color}`
          : '0 2px 8px 0 rgba(0,0,0,0.08)',
        transitionDelay: `${Math.min(index * 40, 300)}ms`,
      }}
      onClick={onEdit}
    >
      {/* Pinned ribbon */}
      {note.is_pinned && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="w-6 h-6 rounded-full flex items-center
                          justify-center shadow-sm"
            style={{
              backgroundColor: note.color,
              border: '2px solid rgba(0,0,0,0.1)',
            }}>
            <Pin size={11} style={{ color:textColor }} fill={textColor} />
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="p-4 flex flex-col h-full">

        {/* Top bar — action buttons always in flow, not absolute */}
        <div className="flex items-center justify-between mb-2 min-h-[28px]">
          {/* Color picker — shown when editing, takes left side */}
          {isEditing ? (
            <div
              className="flex gap-1.5 flex-wrap animate-slide-down"
              onClick={e => e.stopPropagation()}
            >
              {NOTE_COLORS.map(({ hex, name }) => (
                <button
                  key={hex}
                  onClick={e => {
                    e.stopPropagation();
                    onUpdate({ color: hex });
                  }}
                  title={name}
                  className={`w-5 h-5 rounded-full transition-all
                               duration-150 hover:scale-125
                               active:scale-95 flex-shrink-0
                    ${note.color === hex
                      ? 'ring-2 ring-offset-1 ring-zinc-600 scale-110'
                      : ''
                    }`}
                  style={{
                    backgroundColor: hex,
                    border: '1.5px solid rgba(0,0,0,0.1)',
                  }}
                />
              ))}
            </div>
          ) : (
            <div /> /* spacer */
          )}

          {/* Action buttons — right side, always in flow */}
          <div
            className="flex gap-1 opacity-0 group-hover:opacity-100
                       transition-all duration-200 flex-shrink-0 ml-2"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={e => { e.stopPropagation(); onPin(); }}
              className="p-1.5 rounded-lg backdrop-blur-sm
                         transition-all duration-150
                         hover:scale-110 active:scale-95"
              style={{ backgroundColor:'rgba(0,0,0,0.12)' }}
              title={note.is_pinned ? 'Unpin' : 'Pin'}
            >
              {note.is_pinned
                ? <PinOff size={13} style={{ color:textColor }} />
                : <Pin    size={13} style={{ color:textColor }} />
              }
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-lg backdrop-blur-sm
                         transition-all duration-150
                         hover:scale-110 active:scale-95"
              style={{ backgroundColor:'rgba(0,0,0,0.12)' }}
              title="Delete"
            >
              <Trash2 size={13} style={{ color:textColor }} />
            </button>
          </div>
        </div>

        {/* Title */}
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleBlur}
          onClick={e => e.stopPropagation()}
          className="font-bold text-sm bg-transparent border-none
                     outline-none w-full mb-2 placeholder:opacity-40
                     font-sans leading-snug"
          style={{ color:textColor }}
          placeholder="Title"
        />

        {/* Divider */}
        <div className="w-full h-px mb-2 flex-shrink-0"
          style={{ backgroundColor:'rgba(0,0,0,0.08)' }} />

        {/* Content */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onBlur={handleBlur}
          onClick={e => e.stopPropagation()}
          className="flex-1 bg-transparent border-none outline-none
                     resize-none text-xs leading-relaxed w-full
                     placeholder:opacity-40 font-sans"
          style={{ color:textColor, minHeight:'80px' }}
          placeholder="Write something..."
        />

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2
                        flex-shrink-0"
          style={{ borderTop:'1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-2xs" style={{ color:mutedColor }}>
            {new Date(note.updated_at).toLocaleDateString('en', {
              month:'short', day:'numeric',
            })}
          </p>
          <p className="text-2xs" style={{ color:mutedColor }}>
            {wordCount > 0 ? `${wordCount}w` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-zinc-400" />
      <p className="text-xs font-semibold text-zinc-500
                    dark:text-zinc-400 uppercase tracking-widest">
        {label}
      </p>
      <span className="badge bg-zinc-100 dark:bg-zinc-800
                        text-zinc-500 dark:text-zinc-400 text-xs">
        {count}
      </span>
    </div>
  );
}

// ── Masonry grid ──────────────────────────────────────────────
function MasonryGrid({ notes, editing, setEditing,
                       updateNote, deleteNote, togglePin, offset=0 }) {
  const cols = useColumnCount();
  
  // Create defined number of column arrays
  const columns = Array.from({ length: cols }, () => []);
  
  // Distribute notes consistently top-to-bottom
  notes.forEach((note, i) => {
    columns[i % cols].push({ note, index: i });
  });

  return (
    <div className="flex gap-4 items-start w-full">
      {columns.map((col, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-4 flex-1 min-w-0">
          {col.map(({ note, index }) => (
            <NoteCard
              key={note.id}
              note={note}
              index={offset + index}
              isEditing={editing === note.id}
              onEdit={() => setEditing(note.id)}
              onBlur={() => setEditing(null)}
              onUpdate={changes => updateNote(note.id, changes)}
              onDelete={() => deleteNote(note.id)}
              onPin={() => togglePin(note.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Color filter bar ──────────────────────────────────────────
function ColorFilter({ activeColor, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-xl text-xs font-medium
                    border transition-all duration-150
          ${!activeColor
            ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300'
          }`}
      >
        All
      </button>
      {NOTE_COLORS.map(({ hex, name }) => (
        <button
          key={hex}
          onClick={() => onChange(hex === activeColor ? null : hex)}
          title={name}
          className={`w-7 h-7 rounded-xl transition-all duration-150
                      hover:scale-110 active:scale-95 flex-shrink-0
            ${activeColor === hex
              ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-600 scale-110'
              : ''
            }`}
          style={{ backgroundColor: hex,
                   border:'1.5px solid rgba(0,0,0,0.1)' }}
        />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function Notes() {
  const [notes,       setNotes]       = useState([]);
  const [editing,     setEditing]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [colorFilter, setColorFilter] = useState(null);
  const [newNoteColor, setNewNoteColor] = useState(NOTE_COLORS[0].hex);

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      const { data } = await api.get('/notes');
      setNotes(data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createNote = async () => {
    try {
      const { data } = await api.post('/notes', {
        title:'New Note', content:'', color: newNoteColor || NOTE_COLORS[0].hex,
      });
      setNotes(n => [data, ...n]);
      setEditing(data.id);
    } catch(e) { console.error(e); }
  };

  const updateNote = async (id, changes) => {
    try {
      const note    = notes.find(n => n.id === id);
      const updated = { ...note, ...changes };
      await api.put(`/notes/${id}`, updated);
      setNotes(ns => ns.map(n =>
        n.id === id ? { ...n, ...changes } : n
      ));
    } catch(e) { console.error(e); }
  };

  const deleteNote = async id => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(ns => ns.filter(n => n.id !== id));
    } catch(e) { console.error(e); }
  };

  const togglePin = async id => {
    try {
      const { data } = await api.patch(`/notes/${id}/pin`);
      setNotes(ns => ns.map(n =>
        n.id === id ? { ...n, is_pinned: data.is_pinned } : n
      ));
    } catch(e) { console.error(e); }
  };

  // Filter logic
  const allFiltered = notes.filter(n => {
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchColor = !colorFilter || n.color === colorFilter;
    return matchSearch && matchColor;
  });

  const pinned   = allFiltered.filter(n =>  n.is_pinned);
  const unpinned = allFiltered.filter(n => !n.is_pinned);

  const gridProps = { editing, setEditing, updateNote,
                      deleteNote, togglePin };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Notes</h1>
          <p className="page-subtitle">
            Capture your thoughts, goals, and ideas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 
                          rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hidden sm:flex">
            {NOTE_COLORS.map(({ hex, name }) => (
              <button
                key={hex}
                onClick={() => setNewNoteColor(hex)}
                title={`New Note Color: ${name}`}
                className={`w-6 h-6 rounded-lg transition-all duration-150
                            hover:scale-110 active:scale-95 flex-shrink-0
                  ${newNoteColor === hex
                    ? 'ring-2 ring-offset-1 ring-zinc-400 dark:ring-zinc-600 scale-110'
                    : ''
                  }`}
                style={{ backgroundColor: hex, border:'1px solid rgba(0,0,0,0.1)' }}
              />
            ))}
          </div>
          <button onClick={createNote} className="btn-primary group">
            <Plus size={16}
              className="group-hover:rotate-90
                         transition-transform duration-200" />
            New note
          </button>
        </div>
      </div>

      {/* ── Search + color filter ── */}
      <div className="card p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2
                       text-zinc-400 pointer-events-none" />
          <input
            className="input pl-10 pr-10"
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-zinc-400 hover:text-zinc-600
                         transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Color filter */}
        <ColorFilter
          activeColor={colorFilter}
          onChange={setColorFilter}
        />
      </div>

      {/* ── Stats strip ── */}
      {notes.length > 0 && (
        <div className="flex items-center gap-4 text-xs
                        text-zinc-400 px-1">
          <span className="flex items-center gap-1.5">
            <StickyNote size={12} />
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
          {pinned.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Pin size={12} />
              {pinned.length} pinned
            </span>
          )}
          {(search || colorFilter) && (
            <span className="text-brand-500 font-medium">
              {allFiltered.length} result
              {allFiltered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="columns-1 sm:columns-2 lg:columns-3
                        xl:columns-4 gap-4">
          {[180,220,160,200,240,180].map((h, i) => (
            <div key={i} className="break-inside-avoid mb-4">
              <div className="skeleton rounded-2xl"
                style={{ height:`${h}px` }} />
            </div>
          ))}
        </div>
      ) : allFiltered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20
                          rounded-2xl flex items-center justify-center
                          mx-auto mb-4">
            <StickyNote size={28}
              className="text-yellow-400" />
          </div>
          <p className="font-semibold text-zinc-600
                         dark:text-zinc-400 mb-1">
            {search || colorFilter
              ? 'No notes match your filter'
              : 'No notes yet'
            }
          </p>
          <p className="text-sm text-zinc-400 mb-5">
            {search || colorFilter
              ? 'Try a different search or color'
              : 'Create your first note to get started'
            }
          </p>
          {!search && !colorFilter && (
            <button onClick={createNote}
              className="btn-primary mx-auto">
              <Plus size={15} /> Create a note
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Pinned section */}
          {pinned.length > 0 && (
            <div>
              <SectionHeader
                icon={Pin}
                label="Pinned"
                count={pinned.length}
              />
              <MasonryGrid
                notes={pinned}
                offset={0}
                {...gridProps}
              />
            </div>
          )}

          {/* Other notes */}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <SectionHeader
                  icon={StickyNote}
                  label="Other notes"
                  count={unpinned.length}
                />
              )}
              <MasonryGrid
                notes={unpinned}
                offset={pinned.length}
                {...gridProps}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}