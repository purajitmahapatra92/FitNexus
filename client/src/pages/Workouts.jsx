import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Dumbbell, Trash2, Play,
  ChevronDown, ChevronUp, Search,
  X, Check, BookCopy, Zap, Clock,
  BarChart2, RefreshCw,
} from 'lucide-react';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const SPLITS = [
  'Push Pull Legs','Upper Lower','Full Body','Bro Split',
  'Arnold Split','PHUL','PHAT','Powerlifting',
  'Bodybuilding','Calisthenics','Home Workout','Custom',
];
const DAYS = [
  'Sunday','Monday','Tuesday','Wednesday',
  'Thursday','Friday','Saturday',
];
const MUSCLE_GROUPS = [
  'All','Chest','Back','Shoulders','Arms','Legs','Core','Cardio',
];
const REGION_COLORS = {
  Chest:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Back:      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Shoulders: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Arms:      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Legs:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Core:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  Cardio:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

// Split type accent colors for workout cards
const SPLIT_COLORS = {
  'Push Pull Legs': { from:'from-brand-500',  to:'to-purple-600',  light:'bg-brand-50 dark:bg-brand-900/20'   },
  'Upper Lower':    { from:'from-blue-500',   to:'to-cyan-600',    light:'bg-blue-50 dark:bg-blue-900/20'     },
  'Full Body':      { from:'from-green-500',  to:'to-emerald-600', light:'bg-green-50 dark:bg-green-900/20'   },
  'Bro Split':      { from:'from-amber-500',  to:'to-orange-600',  light:'bg-amber-50 dark:bg-amber-900/20'   },
  'Powerlifting':   { from:'from-red-500',    to:'to-rose-600',    light:'bg-red-50 dark:bg-red-900/20'       },
  'Home Workout':   { from:'from-teal-500',   to:'to-green-600',   light:'bg-teal-50 dark:bg-teal-900/20'     },
  'Custom':         { from:'from-zinc-500',   to:'to-zinc-600',    light:'bg-zinc-50 dark:bg-zinc-800'        },
};

const getSplitColor = split => {
  for (const key of Object.keys(SPLIT_COLORS)) {
    if (split?.includes(key.split(' ')[0])) return SPLIT_COLORS[key];
  }
  return SPLIT_COLORS['Custom'];
};

// ─────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    key:'ppl', label:'Push Pull Legs',
    desc:'3-day split hitting each muscle group with dedicated push, pull, and leg sessions.',
    days:3, level:'Intermediate',
    color:'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800',
    badge:'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
    accent:'from-brand-500 to-purple-600',
    muscles:['Chest','Back','Legs','Shoulders','Arms'],
    workouts:[
      { name:'Push Day', split_type:'Push Pull Legs', day_of_week:1, exercises:[
        { name:'Barbell Bench Press',   sets:4, reps:8,  weight_kg:60,  rest_seconds:120 },
        { name:'Incline Barbell Press', sets:3, reps:10, weight_kg:50,  rest_seconds:90  },
        { name:'Cable Crossover',       sets:3, reps:12, weight_kg:15,  rest_seconds:60  },
        { name:'Barbell Overhead Press',sets:3, reps:8,  weight_kg:40,  rest_seconds:120 },
        { name:'Lateral Raise',         sets:4, reps:15, weight_kg:10,  rest_seconds:60  },
        { name:'Tricep Pushdown',       sets:3, reps:12, weight_kg:20,  rest_seconds:60  },
        { name:'Skull Crusher',         sets:3, reps:10, weight_kg:25,  rest_seconds:90  },
      ]},
      { name:'Pull Day', split_type:'Push Pull Legs', day_of_week:3, exercises:[
        { name:'Conventional Deadlift', sets:4, reps:5,  weight_kg:100, rest_seconds:180 },
        { name:'Barbell Row',           sets:4, reps:8,  weight_kg:60,  rest_seconds:120 },
        { name:'Pull-Up',               sets:3, reps:8,  weight_kg:0,   rest_seconds:120 },
        { name:'Seated Cable Row',      sets:3, reps:12, weight_kg:50,  rest_seconds:90  },
        { name:'Face Pull',             sets:3, reps:15, weight_kg:20,  rest_seconds:60  },
        { name:'Barbell Curl',          sets:3, reps:12, weight_kg:30,  rest_seconds:60  },
        { name:'Hammer Curl',           sets:3, reps:12, weight_kg:14,  rest_seconds:60  },
      ]},
      { name:'Leg Day', split_type:'Push Pull Legs', day_of_week:5, exercises:[
        { name:'Back Squat',            sets:4, reps:6,  weight_kg:80,  rest_seconds:180 },
        { name:'Romanian Deadlift',     sets:3, reps:10, weight_kg:60,  rest_seconds:120 },
        { name:'Leg Press',             sets:3, reps:12, weight_kg:120, rest_seconds:90  },
        { name:'Bulgarian Split Squat', sets:3, reps:10, weight_kg:20,  rest_seconds:90  },
        { name:'Leg Curl',              sets:3, reps:12, weight_kg:40,  rest_seconds:60  },
        { name:'Calf Raise',            sets:4, reps:20, weight_kg:0,   rest_seconds:45  },
      ]},
    ],
  },
  {
    key:'upper_lower', label:'Upper / Lower',
    desc:'4-day split alternating upper and lower body for balanced strength and hypertrophy.',
    days:4, level:'Intermediate',
    color:'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    badge:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    accent:'from-blue-500 to-cyan-600',
    muscles:['Chest','Back','Legs','Shoulders'],
    workouts:[
      { name:'Upper A', split_type:'Upper Lower', day_of_week:1, exercises:[
        { name:'Barbell Bench Press',   sets:4, reps:6,  weight_kg:70,  rest_seconds:180 },
        { name:'Barbell Row',           sets:4, reps:6,  weight_kg:60,  rest_seconds:180 },
        { name:'Barbell Overhead Press',sets:3, reps:8,  weight_kg:45,  rest_seconds:120 },
        { name:'Pull-Up',               sets:3, reps:8,  weight_kg:0,   rest_seconds:120 },
        { name:'Barbell Curl',          sets:3, reps:10, weight_kg:30,  rest_seconds:60  },
        { name:'Tricep Pushdown',       sets:3, reps:10, weight_kg:22,  rest_seconds:60  },
      ]},
      { name:'Lower A', split_type:'Upper Lower', day_of_week:2, exercises:[
        { name:'Back Squat',            sets:4, reps:6,  weight_kg:90,  rest_seconds:180 },
        { name:'Romanian Deadlift',     sets:3, reps:8,  weight_kg:70,  rest_seconds:120 },
        { name:'Leg Press',             sets:3, reps:10, weight_kg:130, rest_seconds:90  },
        { name:'Leg Curl',              sets:3, reps:12, weight_kg:45,  rest_seconds:60  },
        { name:'Calf Raise',            sets:4, reps:15, weight_kg:0,   rest_seconds:45  },
      ]},
      { name:'Upper B', split_type:'Upper Lower', day_of_week:4, exercises:[
        { name:'Incline Barbell Press', sets:4, reps:8,  weight_kg:55,  rest_seconds:120 },
        { name:'Seated Cable Row',      sets:4, reps:8,  weight_kg:55,  rest_seconds:120 },
        { name:'Dumbbell Bench Press',  sets:3, reps:10, weight_kg:26,  rest_seconds:90  },
        { name:'Lat Pulldown',          sets:3, reps:10, weight_kg:50,  rest_seconds:90  },
        { name:'Lateral Raise',         sets:3, reps:15, weight_kg:10,  rest_seconds:60  },
        { name:'Skull Crusher',         sets:3, reps:10, weight_kg:30,  rest_seconds:90  },
      ]},
      { name:'Lower B', split_type:'Upper Lower', day_of_week:5, exercises:[
        { name:'Conventional Deadlift', sets:4, reps:5,  weight_kg:110, rest_seconds:180 },
        { name:'Bulgarian Split Squat', sets:3, reps:8,  weight_kg:24,  rest_seconds:120 },
        { name:'Leg Extension',         sets:3, reps:12, weight_kg:50,  rest_seconds:60  },
        { name:'Leg Curl',              sets:3, reps:12, weight_kg:40,  rest_seconds:60  },
        { name:'Hip Thrust',            sets:3, reps:10, weight_kg:60,  rest_seconds:90  },
        { name:'Seated Calf Raise',     sets:4, reps:15, weight_kg:30,  rest_seconds:45  },
      ]},
    ],
  },
  {
    key:'full_body', label:'Full Body 3x',
    desc:'3-day full body training hitting all major muscle groups every session.',
    days:3, level:'Beginner',
    color:'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    badge:'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    accent:'from-green-500 to-emerald-600',
    muscles:['Chest','Back','Legs','Core'],
    workouts:[
      { name:'Full Body A', split_type:'Full Body', day_of_week:1, exercises:[
        { name:'Back Squat',            sets:3, reps:8,  weight_kg:70, rest_seconds:120 },
        { name:'Barbell Bench Press',   sets:3, reps:8,  weight_kg:55, rest_seconds:120 },
        { name:'Barbell Row',           sets:3, reps:8,  weight_kg:50, rest_seconds:120 },
        { name:'Barbell Overhead Press',sets:2, reps:10, weight_kg:35, rest_seconds:90  },
        { name:'Barbell Curl',          sets:2, reps:12, weight_kg:25, rest_seconds:60  },
        { name:'Plank',                 sets:3, reps:1,  weight_kg:0,  rest_seconds:60  },
      ]},
      { name:'Full Body B', split_type:'Full Body', day_of_week:3, exercises:[
        { name:'Romanian Deadlift',     sets:3, reps:8,  weight_kg:60, rest_seconds:120 },
        { name:'Incline Barbell Press', sets:3, reps:8,  weight_kg:45, rest_seconds:120 },
        { name:'Pull-Up',               sets:3, reps:6,  weight_kg:0,  rest_seconds:120 },
        { name:'Lateral Raise',         sets:3, reps:15, weight_kg:8,  rest_seconds:60  },
        { name:'Hammer Curl',           sets:2, reps:12, weight_kg:12, rest_seconds:60  },
        { name:'Dead Bug',              sets:3, reps:10, weight_kg:0,  rest_seconds:60  },
      ]},
      { name:'Full Body C', split_type:'Full Body', day_of_week:5, exercises:[
        { name:'Goblet Squat',          sets:3, reps:12, weight_kg:24, rest_seconds:90 },
        { name:'Dumbbell Bench Press',  sets:3, reps:10, weight_kg:22, rest_seconds:90 },
        { name:'Seated Cable Row',      sets:3, reps:10, weight_kg:45, rest_seconds:90 },
        { name:'Seated Dumbbell Press', sets:3, reps:10, weight_kg:16, rest_seconds:90 },
        { name:'Tricep Pushdown',       sets:2, reps:12, weight_kg:18, rest_seconds:60 },
        { name:'Hanging Leg Raise',     sets:3, reps:12, weight_kg:0,  rest_seconds:60 },
      ]},
    ],
  },
  {
    key:'bro_split', label:'Bro Split 5-Day',
    desc:'Classic 5-day split with each day dedicated to one muscle group.',
    days:5, level:'Intermediate',
    color:'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    badge:'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    accent:'from-amber-500 to-orange-600',
    muscles:['Chest','Back','Shoulders','Arms','Legs'],
    workouts:[
      { name:'Chest Day', split_type:'Bro Split', day_of_week:1, exercises:[
        { name:'Barbell Bench Press',   sets:4, reps:8,  weight_kg:70, rest_seconds:120 },
        { name:'Incline Barbell Press', sets:4, reps:10, weight_kg:55, rest_seconds:90  },
        { name:'Decline Barbell Press', sets:3, reps:10, weight_kg:50, rest_seconds:90  },
        { name:'Dumbbell Flyes',        sets:3, reps:12, weight_kg:14, rest_seconds:60  },
        { name:'Cable Crossover',       sets:3, reps:15, weight_kg:12, rest_seconds:60  },
        { name:'Chest Dip',             sets:3, reps:12, weight_kg:0,  rest_seconds:60  },
      ]},
      { name:'Back Day', split_type:'Bro Split', day_of_week:2, exercises:[
        { name:'Conventional Deadlift', sets:4, reps:5,  weight_kg:100, rest_seconds:180 },
        { name:'Pull-Up',               sets:4, reps:8,  weight_kg:0,   rest_seconds:120 },
        { name:'Barbell Row',           sets:4, reps:8,  weight_kg:60,  rest_seconds:120 },
        { name:'Lat Pulldown',          sets:3, reps:10, weight_kg:55,  rest_seconds:90  },
        { name:'Seated Cable Row',      sets:3, reps:12, weight_kg:50,  rest_seconds:90  },
        { name:'Face Pull',             sets:3, reps:15, weight_kg:20,  rest_seconds:60  },
      ]},
      { name:'Shoulder Day', split_type:'Bro Split', day_of_week:3, exercises:[
        { name:'Barbell Overhead Press',sets:4, reps:8,  weight_kg:50, rest_seconds:120 },
        { name:'Seated Dumbbell Press', sets:3, reps:10, weight_kg:20, rest_seconds:90  },
        { name:'Lateral Raise',         sets:4, reps:15, weight_kg:10, rest_seconds:60  },
        { name:'Front Raise',           sets:3, reps:12, weight_kg:10, rest_seconds:60  },
        { name:'Rear Delt Fly',         sets:3, reps:15, weight_kg:8,  rest_seconds:60  },
        { name:'Shrugs',                sets:4, reps:12, weight_kg:60, rest_seconds:60  },
      ]},
      { name:'Arm Day', split_type:'Bro Split', day_of_week:5, exercises:[
        { name:'Barbell Curl',          sets:4, reps:10, weight_kg:30, rest_seconds:90 },
        { name:'Incline Dumbbell Curl', sets:3, reps:12, weight_kg:12, rest_seconds:60 },
        { name:'Preacher Curl',         sets:3, reps:12, weight_kg:25, rest_seconds:60 },
        { name:'Skull Crusher',         sets:4, reps:10, weight_kg:30, rest_seconds:90 },
        { name:'Close Grip Bench Press',sets:3, reps:10, weight_kg:50, rest_seconds:90 },
        { name:'Rope Pushdown',         sets:3, reps:12, weight_kg:22, rest_seconds:60 },
      ]},
      { name:'Leg Day', split_type:'Bro Split', day_of_week:6, exercises:[
        { name:'Back Squat',            sets:5, reps:5,  weight_kg:90,  rest_seconds:180 },
        { name:'Leg Press',             sets:4, reps:10, weight_kg:140, rest_seconds:120 },
        { name:'Romanian Deadlift',     sets:3, reps:10, weight_kg:70,  rest_seconds:120 },
        { name:'Leg Extension',         sets:3, reps:15, weight_kg:55,  rest_seconds:60  },
        { name:'Leg Curl',              sets:3, reps:15, weight_kg:45,  rest_seconds:60  },
        { name:'Calf Raise',            sets:5, reps:20, weight_kg:0,   rest_seconds:45  },
      ]},
    ],
  },
  {
    key:'home_workout', label:'Home Bodyweight',
    desc:'No equipment needed. Full body training you can do anywhere, anytime.',
    days:3, level:'Beginner',
    color:'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
    badge:'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    accent:'from-teal-500 to-green-600',
    muscles:['Chest','Back','Legs','Core'],
    workouts:[
      { name:'Home Push', split_type:'Home Workout', day_of_week:1, exercises:[
        { name:'Push-Ups',          sets:4, reps:15, weight_kg:0, rest_seconds:60 },
        { name:'Wide Push-Ups',     sets:3, reps:12, weight_kg:0, rest_seconds:60 },
        { name:'Tricep Dip',        sets:3, reps:12, weight_kg:0, rest_seconds:60 },
        { name:'Plank',             sets:3, reps:1,  weight_kg:0, rest_seconds:60 },
        { name:'Mountain Climbers', sets:3, reps:20, weight_kg:0, rest_seconds:45 },
      ]},
      { name:'Home Pull', split_type:'Home Workout', day_of_week:3, exercises:[
        { name:'Pull-Up',           sets:4, reps:6,  weight_kg:0, rest_seconds:120 },
        { name:'Chin-Up',           sets:3, reps:8,  weight_kg:0, rest_seconds:120 },
        { name:'Dead Bug',          sets:3, reps:12, weight_kg:0, rest_seconds:60  },
        { name:'Hanging Leg Raise', sets:3, reps:10, weight_kg:0, rest_seconds:60  },
        { name:'Bicycle Crunch',    sets:3, reps:20, weight_kg:0, rest_seconds:45  },
      ]},
      { name:'Home Legs', split_type:'Home Workout', day_of_week:5, exercises:[
        { name:'Goblet Squat',   sets:4, reps:15, weight_kg:0, rest_seconds:60 },
        { name:'Walking Lunge',  sets:3, reps:12, weight_kg:0, rest_seconds:60 },
        { name:'Hip Thrust',     sets:3, reps:15, weight_kg:0, rest_seconds:60 },
        { name:'Calf Raise',     sets:4, reps:20, weight_kg:0, rest_seconds:45 },
        { name:'Burpees',        sets:3, reps:10, weight_kg:0, rest_seconds:60 },
      ]},
    ],
  },
  {
    key:'strength', label:'Powerlifting',
    desc:'Big 3 focused program — squat, bench, deadlift. Built for raw strength.',
    days:4, level:'Advanced',
    color:'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    badge:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    accent:'from-red-500 to-rose-600',
    muscles:['Legs','Chest','Back'],
    workouts:[
      { name:'Squat Day', split_type:'Powerlifting', day_of_week:1, exercises:[
        { name:'Back Squat',            sets:5, reps:5,  weight_kg:100, rest_seconds:300 },
        { name:'Front Squat',           sets:3, reps:3,  weight_kg:70,  rest_seconds:240 },
        { name:'Romanian Deadlift',     sets:3, reps:8,  weight_kg:70,  rest_seconds:120 },
        { name:'Leg Press',             sets:3, reps:10, weight_kg:130, rest_seconds:90  },
        { name:'Leg Curl',              sets:3, reps:10, weight_kg:50,  rest_seconds:90  },
      ]},
      { name:'Bench Day', split_type:'Powerlifting', day_of_week:3, exercises:[
        { name:'Barbell Bench Press',   sets:5, reps:5, weight_kg:80, rest_seconds:300 },
        { name:'Close Grip Bench Press',sets:3, reps:5, weight_kg:60, rest_seconds:180 },
        { name:'Barbell Row',           sets:4, reps:6, weight_kg:65, rest_seconds:180 },
        { name:'Skull Crusher',         sets:3, reps:8, weight_kg:35, rest_seconds:90  },
        { name:'Barbell Curl',          sets:3, reps:8, weight_kg:35, rest_seconds:90  },
      ]},
      { name:'Deadlift Day', split_type:'Powerlifting', day_of_week:5, exercises:[
        { name:'Conventional Deadlift', sets:5, reps:3,  weight_kg:120, rest_seconds:300 },
        { name:'Sumo Deadlift',         sets:3, reps:3,  weight_kg:100, rest_seconds:240 },
        { name:'Barbell Row',           sets:4, reps:5,  weight_kg:70,  rest_seconds:180 },
        { name:'Pull-Up',               sets:3, reps:5,  weight_kg:0,   rest_seconds:120 },
        { name:'Hyperextension',        sets:3, reps:12, weight_kg:0,   rest_seconds:60  },
      ]},
      { name:'Accessory Day', split_type:'Powerlifting', day_of_week:6, exercises:[
        { name:'Barbell Overhead Press',sets:4, reps:6,  weight_kg:50, rest_seconds:120 },
        { name:'Bulgarian Split Squat', sets:3, reps:8,  weight_kg:20, rest_seconds:90  },
        { name:'Face Pull',             sets:3, reps:15, weight_kg:20, rest_seconds:60  },
        { name:'Lateral Raise',         sets:3, reps:15, weight_kg:10, rest_seconds:60  },
        { name:'Plank',                 sets:3, reps:1,  weight_kg:0,  rest_seconds:60  },
      ]},
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Exercise Picker Modal
// ─────────────────────────────────────────────────────────────
function ExercisePicker({ workoutId, onClose, onAdded }) {
  const [exercises,  setExercises]  = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [muscle,     setMuscle]     = useState('All');
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [adding,     setAdding]     = useState(false);
  const [bodyWeight, setBodyWeight] = useState(0);
  const [config, setConfig] = useState({
    sets:3, reps:10, weight_kg:0, rest_seconds:90,
  });

  useEffect(() => {
    api.get('/exercises')
      .then(({ data }) => { setExercises(data); setFiltered(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
    api.get('/profile')
      .then(({ data }) => setBodyWeight(Number(data.weight_kg)||0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let r = [...exercises];
    if (muscle !== 'All') r = r.filter(e => e.muscle_group === muscle);
    if (search) r = r.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.primary_muscle?.toLowerCase().includes(search.toLowerCase()) ||
      e.equipment?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(r);
  }, [search, muscle, exercises]);

  const handleSelect = ex => {
    if (selected?.id === ex.id) { setSelected(null); return; }
    setSelected(ex);
    setConfig(c => ({
      ...c,
      weight_kg: ex.equipment === 'Bodyweight' && bodyWeight > 0
        ? bodyWeight : c.weight_kg,
    }));
  };

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    try {
      await api.post(`/workouts/${workoutId}/exercises`, {
        exercise_id:  selected.id,
        sets:         Number(config.sets),
        reps:         Number(config.reps),
        weight_kg:    Number(config.weight_kg),
        rest_seconds: Number(config.rest_seconds),
      });
      onAdded();
      setSelected(null);
      setConfig({ sets:3, reps:10, weight_kg:0, rest_seconds:90 });
    } catch (e) { console.error(e); }
    finally { setAdding(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm
                    flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="glass-panel w-full max-w-2xl flex flex-col animate-scale-in"
        style={{ height:'85vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-zinc-100 dark:border-zinc-800
                        flex-shrink-0">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Add exercise
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select an exercise then configure sets, reps and weight
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2
                         text-zinc-400 pointer-events-none" />
            <input className="input pl-10"
              placeholder="Search by name, muscle or equipment..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-zinc-400 hover:text-zinc-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Muscle tabs */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {MUSCLE_GROUPS.map(m => (
              <button key={m} onClick={() => setMuscle(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium
                            whitespace-nowrap transition-all border
                            flex-shrink-0
                  ${muscle === m
                    ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                  }`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide
                        px-5 min-h-0">
          {loading ? (
            <div className="space-y-2 py-2">
              {[1,2,3,4,5].map(i => (
                <div key={i}
                  className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center
                            py-12 text-center">
              <Search size={28}
                className="text-zinc-200 dark:text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-400">
                No exercises found
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 pb-2">
              {filtered.map(ex => (
                <button key={ex.id}
                  onClick={() => handleSelect(ex)}
                  className={`w-full flex items-center justify-between
                              p-3 rounded-xl border transition-all
                              text-left group
                    ${selected?.id === ex.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-sm'
                      : 'border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-zinc-900
                                     dark:text-zinc-100 truncate">
                        {ex.name}
                      </p>
                      {ex.equipment === 'Bodyweight' &&
                        bodyWeight > 0 && (
                        <span className="text-xs font-medium
                                         text-green-600
                                         dark:text-green-400
                                         flex-shrink-0">
                          BW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
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
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2
                                   flex items-center justify-center
                                   flex-shrink-0 ml-3 transition-all
                    ${selected?.id === ex.id
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-zinc-200 dark:border-zinc-700 group-hover:border-brand-300'
                    }`}>
                    {selected?.id === ex.id && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Config */}
        {selected && (
          <div className="flex-shrink-0 border-t border-zinc-100
                          dark:border-zinc-800 px-5 py-4 space-y-3
                          bg-zinc-50/50 dark:bg-zinc-800/20
                          animate-slide-up">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900
                             dark:text-zinc-100">
                {selected.name}
              </p>
              {selected.equipment === 'Bodyweight' &&
                bodyWeight > 0 && (
                <span className="text-xs font-medium text-green-600
                                  dark:text-green-400 flex items-center
                                  gap-1">
                  <Check size={11} />
                  Auto-filled from profile
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key:'sets',         label:'Sets',     min:1,  max:20,  step:1   },
                { key:'reps',         label:'Reps',     min:1,  max:100, step:1   },
                { key:'weight_kg',    label:'Weight kg',min:0,  max:500, step:2.5 },
                { key:'rest_seconds', label:'Rest sec', min:10, max:600, step:15  },
              ].map(({ key, label, min, max, step }) => (
                <div key={key}>
                  <label className="label text-xs">{label}</label>
                  <input type="number"
                    className="input text-sm py-2 text-center"
                    min={min} max={max} step={step}
                    value={config[key]}
                    onChange={e =>
                      setConfig(c => ({...c, [key]: e.target.value}))
                    }
                  />
                </div>
              ))}
            </div>
            <button onClick={handleAdd} disabled={adding}
              className="btn-primary w-full">
              {adding
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</>
                : <><Plus size={15} /> Add to workout</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Template Card
// ─────────────────────────────────────────────────────────────
function TemplateCard({ template, onImport, importing }) {
  const [expanded, setExpanded] = useState(false);

  const LEVEL_COLORS = {
    Beginner:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    Intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Advanced:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="card overflow-hidden group hover:shadow-card-md
                    hover:-translate-y-0.5 transition-all duration-200">
      {/* Gradient header strip */}
      <div className={`h-1.5 bg-gradient-to-r ${template.accent}`} />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`badge ${template.badge}`}>
                {template.days} days / week
              </span>
              <span className={`badge ${LEVEL_COLORS[template.level]}`}>
                {template.level}
              </span>
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
              {template.label}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400
                           mt-1 leading-relaxed">
              {template.desc}
            </p>
          </div>
        </div>

        {/* Muscle group pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.muscles.map(m => (
            <span key={m}
              className={`badge text-xs ${
                REGION_COLORS[m] || 'bg-zinc-100 text-zinc-600'
              }`}>
              {m}
            </span>
          ))}
        </div>

        {/* Workout day pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.workouts.map(w => (
            <span key={w.name}
              className="px-2.5 py-1 rounded-lg text-xs font-medium
                         bg-zinc-100 dark:bg-zinc-800
                         text-zinc-600 dark:text-zinc-400">
              {w.name}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onImport(template)}
            disabled={importing === template.key}
            className="btn-primary flex-1 flex items-center
                       justify-center gap-2"
          >
            {importing === template.key ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin" />
                Importing...
              </>
            ) : (
              <><Zap size={14} /> Import program</>
            )}
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="btn-secondary px-3 py-2"
            title="Preview exercises"
          >
            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
      </div>

      {/* Expanded preview */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800
                        animate-slide-down">
          {template.workouts.map((w, wi) => (
            <div key={wi}
              className={`px-5 py-3 ${
                wi < template.workouts.length - 1
                  ? 'border-b border-zinc-50 dark:border-zinc-800/60'
                  : ''
              }`}>
              <p className="text-xs font-semibold text-zinc-700
                             dark:text-zinc-300 mb-2 flex items-center
                             justify-between">
                <span>{w.name}</span>
                <span className="text-zinc-400 font-normal">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][w.day_of_week]}
                </span>
              </p>
              <div className="space-y-1">
                {w.exercises.map((ex, ei) => (
                  <div key={ei}
                    className="flex items-center justify-between
                               text-xs text-zinc-500 dark:text-zinc-400
                               py-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full
                                       bg-zinc-300 dark:bg-zinc-600" />
                      {ex.name}
                      {ex.weight_kg === 0 && (
                        <span className="text-green-500 font-medium">
                          (BW)
                        </span>
                      )}
                    </span>
                    <span className="text-zinc-400 tabular-nums">
                      {ex.sets}×{ex.reps}
                      {ex.weight_kg > 0
                        ? ` @ ${ex.weight_kg}kg` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Workouts page
// ─────────────────────────────────────────────────────────────
export default function Workouts() {
  const navigate = useNavigate();

  const [tab,       setTab]       = useState('my');
  const [workouts,  setWorkouts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [expanded,  setExpanded]  = useState(null);
  const [pickerFor, setPickerFor] = useState(null);
  const [importing, setImporting] = useState(null);
  const [importMsg, setImportMsg] = useState('');
  const [form, setForm] = useState({
    name:'', split_type:'', day_of_week:'',
  });

  useEffect(() => { fetchWorkouts(); }, []);

  const fetchWorkouts = async () => {
    try {
      const { data } = await api.get('/workouts');
      setWorkouts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createWorkout = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/workouts', form);
      setWorkouts(w => [data, ...w]);
      setShowForm(false);
      setForm({ name:'', split_type:'', day_of_week:'' });
      setExpanded(data.id);
      setTab('my');
    } catch (e) { console.error(e); }
  };

  const deleteWorkout = async id => {
    if (!window.confirm('Delete this workout?')) return;
    try {
      await api.delete(`/workouts/${id}`);
      setWorkouts(w => w.filter(x => x.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (e) { console.error(e); }
  };

  const removeExercise = async (workoutId, exerciseRowId) => {
    try {
      await api.delete(`/workouts/${workoutId}/exercises/${exerciseRowId}`);
      setWorkouts(ws => ws.map(w =>
        w.id === workoutId
          ? { ...w, exercises:w.exercises.filter(ex => ex.id !== exerciseRowId) }
          : w
      ));
    } catch (e) { console.error(e); }
  };

  const refreshWorkout = async workoutId => {
    try {
      const { data } = await api.get(`/workouts/${workoutId}`);
      setWorkouts(ws => ws.map(w => w.id === workoutId ? data : w));
    } catch (e) { console.error(e); }
  };

  const importTemplate = async template => {
    setImporting(template.key);
    setImportMsg('');
    try {
      const { data: allEx } = await api.get('/exercises');
      const byName = {};
      allEx.forEach(e => { byName[e.name.toLowerCase()] = e; });
      for (const wd of template.workouts) {
        const { data: workout } = await api.post('/workouts', {
          name: wd.name, split_type: wd.split_type,
          day_of_week: wd.day_of_week,
        });
        for (const exDef of wd.exercises) {
          const ex = byName[exDef.name.toLowerCase()];
          if (!ex) continue;
          await api.post(`/workouts/${workout.id}/exercises`, {
            exercise_id:  ex.id,
            sets:         exDef.sets,
            reps:         exDef.reps,
            weight_kg:    exDef.weight_kg,
            rest_seconds: exDef.rest_seconds,
          });
        }
      }
      await fetchWorkouts();
      setTab('my');
      setImportMsg(
        `${template.label} imported — ${template.workouts.length} workouts added!`
      );
      setTimeout(() => setImportMsg(''), 4000);
    } catch (e) {
      console.error(e);
      setImportMsg('Import failed. Please try again.');
    } finally {
      setImporting(null);
    }
  };

  const startSession = id => navigate(`/session/${id}`);
  const toggleExpand = id => setExpanded(e => e === id ? null : id);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Workouts</h1>
          <p className="page-subtitle">
            Build programs or import a template to get started fast.
          </p>
        </div>
        {tab === 'my' && (
          <button onClick={() => setShowForm(s => !s)}
            className="btn-primary">
            <Plus size={16} /> New workout
          </button>
        )}
      </div>

      {/* ── Import message ── */}
      {importMsg && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20
                        border border-green-100 dark:border-green-800
                        text-sm font-medium text-green-700
                        dark:text-green-400 flex items-center gap-2
                        animate-slide-up">
          <Check size={16} className="flex-shrink-0" />
          {importMsg}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/80
                      rounded-xl p-1 w-fit">
        {[
          { key:'my',        label:'My Workouts' },
          { key:'templates', label:'Templates'   },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-150
              ${tab === key
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ MY WORKOUTS TAB ══ */}
      {tab === 'my' && (
        <div className="space-y-4">

          {/* Create form */}
          {showForm && (
            <div className="card p-5 animate-slide-down
                            border-brand-100 dark:border-brand-900/40">
              <h3 className="font-semibold text-zinc-900
                             dark:text-zinc-100 mb-4">
                New workout plan
              </h3>
              <form onSubmit={createWorkout}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Workout name</label>
                  <input required className="input"
                    placeholder="e.g. Push Day A"
                    value={form.name}
                    onChange={e =>
                      setForm(f => ({...f, name:e.target.value}))
                    }
                  />
                </div>
                <div>
                  <label className="label">Split type</label>
                  <select className="input" value={form.split_type}
                    onChange={e =>
                      setForm(f => ({...f, split_type:e.target.value}))
                    }>
                    <option value="">Select split</option>
                    {SPLITS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Day of week</label>
                  <select className="input" value={form.day_of_week}
                    onChange={e =>
                      setForm(f => ({...f, day_of_week:e.target.value}))
                    }>
                    <option value="">Any day</option>
                    {DAYS.map((d, i) => (
                      <option key={d} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3 flex gap-2 justify-end">
                  <button type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create workout
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Workout list */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="card h-24 skeleton" />
              ))}
            </div>
          ) : workouts.length === 0 ? (
            <div className="card p-14 text-center">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800
                              rounded-2xl flex items-center justify-center
                              mx-auto mb-4">
                <Dumbbell size={28}
                  className="text-zinc-300 dark:text-zinc-600" />
              </div>
              <p className="font-semibold text-zinc-600
                             dark:text-zinc-400 mb-1">
                No workouts yet
              </p>
              <p className="text-sm text-zinc-400 mb-5">
                Create your own or import a ready-made template
              </p>
              <button onClick={() => setTab('templates')}
                className="btn-secondary flex items-center gap-2 mx-auto">
                <BookCopy size={15} /> Browse templates
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map(w => {
                const splitColor = getSplitColor(w.split_type);
                const isExpanded = expanded === w.id;
                return (
                  <div key={w.id}
                    className="card overflow-hidden hover:shadow-card-md animate-slide-up stagger-2
                               transition-all duration-200">

                    {/* Accent top border */}
                    <div className={`h-0.5 bg-gradient-to-r
                                     ${splitColor.from}
                                     ${splitColor.to}`} />

                    {/* Workout row */}
                    <div className="flex items-center justify-between
                                    p-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 ${splitColor.light}
                                         rounded-xl flex items-center
                                         justify-center flex-shrink-0`}>
                          <Dumbbell size={18}
                            className="text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900
                                         dark:text-zinc-100 truncate">
                            {w.name}
                          </p>
                          <div className="flex items-center gap-2
                                          mt-0.5 flex-wrap">
                            <span className="text-xs text-zinc-500
                                             dark:text-zinc-400">
                              {w.split_type || 'Custom'}
                            </span>
                            {w.day_of_week != null && (
                              <>
                                <span className="text-zinc-300
                                                  dark:text-zinc-700">
                                  ·
                                </span>
                                <span className="text-xs text-zinc-500
                                                  dark:text-zinc-400">
                                  {['Sun','Mon','Tue','Wed','Thu',
                                    'Fri','Sat'][w.day_of_week]}
                                </span>
                              </>
                            )}
                            <span className="text-zinc-300
                                             dark:text-zinc-700">
                              ·
                            </span>
                            <span className="text-xs text-zinc-500
                                             dark:text-zinc-400
                                             flex items-center gap-1">
                              <BarChart2 size={11} />
                              {w.exercises?.length || 0} exercises
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2
                                      flex-shrink-0">
                        {/* Start button */}
                        <button
                          onClick={() => startSession(w.id)}
                          className="group relative flex items-center
                                     gap-1.5 px-4 py-2 rounded-xl
                                     bg-brand-500 hover:bg-brand-600
                                     text-white text-xs font-semibold
                                     shadow-[0_2px_8px_0_rgb(99_102_241_/_0.3)]
                                     hover:shadow-[0_4px_12px_0_rgb(99_102_241_/_0.4)]
                                     hover:-translate-y-0.5
                                     transition-all duration-200"
                        >
                          <Play size={11}
                            className="group-hover:scale-110
                                       transition-transform duration-150" />
                          Start
                        </button>

                        <button onClick={() => toggleExpand(w.id)}
                          className="btn-ghost p-2 rounded-xl"
                          title="View / edit exercises">
                          <ChevronDown size={16}
                            className={`transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`} />
                        </button>

                        <button onClick={() => deleteWorkout(w.id)}
                          className="btn-ghost p-2 text-zinc-400
                                     hover:text-red-500
                                     hover:bg-red-50
                                     dark:hover:bg-red-900/20
                                     rounded-xl transition-all
                                     duration-150"
                          title="Delete workout">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded panel */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100
                                      dark:border-zinc-800/60
                                      animate-slide-down">

                        {/* Exercise list */}
                        {!w.exercises?.length ? (
                          <div className="px-5 py-6 text-center">
                            <p className="text-sm text-zinc-400 mb-1">
                              No exercises yet
                            </p>
                            <p className="text-xs text-zinc-400">
                              Add exercises below before starting
                            </p>
                          </div>
                        ) : (
                          <div className="px-5 pt-4 pb-2">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-left text-zinc-400
                                                 dark:text-zinc-500
                                                 border-b border-zinc-50
                                                 dark:border-zinc-800">
                                    <th className="pb-2 font-medium
                                                   pr-4">
                                      Exercise
                                    </th>
                                    <th className="pb-2 font-medium
                                                   hidden sm:table-cell">
                                      Muscle
                                    </th>
                                    <th className="pb-2 font-medium
                                                   text-right">
                                      Sets × Reps
                                    </th>
                                    <th className="pb-2 font-medium
                                                   text-right">
                                      Weight
                                    </th>
                                    <th className="pb-2 font-medium
                                                   text-right">
                                      Rest
                                    </th>
                                    <th className="pb-2 w-8" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {w.exercises.map((ex, ei) => (
                                    <tr key={ex.id}
                                      className="group border-b
                                                 border-zinc-50
                                                 dark:border-zinc-800/60
                                                 last:border-0
                                                 hover:bg-zinc-50/50
                                                 dark:hover:bg-zinc-800/20
                                                 transition-colors">
                                      <td className="py-2.5 font-medium
                                                     text-zinc-800
                                                     dark:text-zinc-200
                                                     pr-4">
                                        <div className="flex items-center
                                                        gap-2">
                                          <span className="w-5 h-5
                                                           rounded-md
                                                           bg-zinc-100
                                                           dark:bg-zinc-800
                                                           flex items-center
                                                           justify-center
                                                           text-zinc-400
                                                           text-xs
                                                           flex-shrink-0
                                                           font-bold">
                                            {ei + 1}
                                          </span>
                                          {ex.exercise_name}
                                        </div>
                                      </td>
                                      <td className="py-2.5 text-zinc-500
                                                     dark:text-zinc-400
                                                     hidden sm:table-cell">
                                        {ex.muscle_group}
                                      </td>
                                      <td className="py-2.5 text-right
                                                     text-zinc-700
                                                     dark:text-zinc-300
                                                     tabular-nums
                                                     whitespace-nowrap">
                                        {ex.sets} × {ex.reps}
                                      </td>
                                      <td className="py-2.5 text-right
                                                     whitespace-nowrap">
                                        {ex.is_bodyweight
                                          ? <span className="text-green-600 dark:text-green-400 font-medium">
                                              BW
                                            </span>
                                          : <span className="text-zinc-700 dark:text-zinc-300 tabular-nums">
                                              {ex.weight_kg}kg
                                            </span>
                                        }
                                      </td>
                                      <td className="py-2.5 text-right
                                                     text-zinc-400
                                                     tabular-nums
                                                     whitespace-nowrap">
                                        <span className="flex items-center
                                                         gap-1 justify-end">
                                          <Clock size={10} />
                                          {ex.rest_seconds}s
                                        </span>
                                      </td>
                                      <td className="py-2.5 text-right">
                                        <button
                                          onClick={() =>
                                            removeExercise(w.id, ex.id)
                                          }
                                          className="opacity-0
                                                     group-hover:opacity-100
                                                     p-1 text-zinc-400
                                                     hover:text-red-500
                                                     hover:bg-red-50
                                                     dark:hover:bg-red-900/20
                                                     rounded-lg
                                                     transition-all
                                                     duration-150"
                                          title="Remove">
                                          <X size={13} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Add exercise button */}
                        <div className="px-5 py-4 border-t border-zinc-50
                                        dark:border-zinc-800/60
                                        bg-zinc-50/50
                                        dark:bg-zinc-800/10">
                          <button
                            onClick={() => setPickerFor(w.id)}
                            className="w-full flex items-center
                                       justify-center gap-2 py-2
                                       rounded-xl border-2 border-dashed
                                       border-zinc-200 dark:border-zinc-700
                                       text-zinc-400 dark:text-zinc-500
                                       hover:border-brand-300
                                       dark:hover:border-brand-700
                                       hover:text-brand-500
                                       dark:hover:text-brand-400
                                       hover:bg-brand-50
                                       dark:hover:bg-brand-900/10
                                       transition-all duration-200
                                       text-sm font-medium group"
                          >
                            <Plus size={15}
                              className="group-hover:rotate-90
                                         transition-transform duration-200" />
                            Add exercise
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TEMPLATES TAB ══ */}
      {tab === 'templates' && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="card p-4 bg-brand-50 dark:bg-brand-900/20
                          border-brand-100 dark:border-brand-800/60">
            <div className="flex items-start gap-3">
              <BookCopy size={18}
                className="text-brand-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand-700
                               dark:text-brand-300">
                  How templates work
                </p>
                <p className="text-xs text-brand-600/70
                               dark:text-brand-400/70 mt-0.5
                               leading-relaxed">
                  Click <strong>Import program</strong> to instantly add
                  all workouts and exercises. Adjust weights and reps
                  to match your level. Preview exercises with the arrow.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up stagger-3">
            {TEMPLATES.map(t => (
              <TemplateCard
                key={t.key}
                template={t}
                onImport={importTemplate}
                importing={importing}
              />
            ))}
          </div>
        </div>
      )}

      {/* Exercise picker modal */}
      {pickerFor && (
        <ExercisePicker
          workoutId={pickerFor}
          onClose={() => setPickerFor(null)}
          onAdded={() => refreshWorkout(pickerFor)}
        />
      )}
    </div>
  );
}