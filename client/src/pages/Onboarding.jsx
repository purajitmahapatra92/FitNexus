import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import api from '../services/api';

const GOALS = [
  { key: 'fat_loss',       label: 'Fat Loss'           },
  { key: 'muscle_gain',    label: 'Muscle Gain'        },
  { key: 'recomposition',  label: 'Body Recomposition' },
  { key: 'strength',       label: 'Strength Training'  },
  { key: 'athletic',       label: 'Athletic Performance'},
  { key: 'endurance',      label: 'Endurance'          },
  { key: 'general_health', label: 'General Health'     },
  { key: 'rehabilitation', label: 'Rehabilitation'     },
];

const EQUIPMENT = [
  'Barbell', 'Dumbbells', 'Cables', 'Machines',
  'Pull-up Bar', 'Resistance Bands', 'Bodyweight Only',
];

export default function Onboarding() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    age: '', gender: '', height_cm: '', weight_kg: '',
    body_fat_pct: '', experience_level: 'beginner',
    injuries: '', training_location: 'gym',
    days_per_week: 4, fitness_goals: [],
    available_equipment: [],
  });

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  const toggleGoal = key =>
    set('fitness_goals', data.fitness_goals.includes(key)
      ? data.fitness_goals.filter(g => g !== key)
      : [...data.fitness_goals, key]);

  const toggleEquip = e =>
    set('available_equipment', data.available_equipment.includes(e)
      ? data.available_equipment.filter(x => x !== e)
      : [...data.available_equipment, e]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.put('/profile/onboard', {
        ...data,
        age:        Number(data.age),
        height_cm:  Number(data.height_cm),
        weight_kg:  Number(data.weight_kg),
        body_fat_pct: data.body_fat_pct ? Number(data.body_fat_pct) : null,
        injuries:   data.injuries ? data.injuries.split(',').map(s => s.trim()) : [],
      });
      updateUser({ onboardingComplete: true, onboarding_complete: true });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    // Step 0 — Basic info
    <div key="basic" className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Basic information</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Help us personalise your experience.</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Age</label>
          <input type="number" className="input" placeholder="25" min="10" max="100"
            value={data.age} onChange={e => set('age', e.target.value)} />
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input" value={data.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Height (cm)</label>
          <input type="number" className="input" placeholder="175"
            value={data.height_cm} onChange={e => set('height_cm', e.target.value)} />
        </div>
        <div>
          <label className="label">Weight (kg)</label>
          <input type="number" className="input" placeholder="75"
            value={data.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
        </div>
        <div>
          <label className="label">Body fat % (optional)</label>
          <input type="number" className="input" placeholder="20"
            value={data.body_fat_pct} onChange={e => set('body_fat_pct', e.target.value)} />
        </div>
        <div>
          <label className="label">Experience level</label>
          <select className="input" value={data.experience_level}
            onChange={e => set('experience_level', e.target.value)}>
            <option value="beginner">Beginner (0–1 yr)</option>
            <option value="intermediate">Intermediate (1–3 yr)</option>
            <option value="advanced">Advanced (3+ yr)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Injuries / limitations (optional)</label>
        <input type="text" className="input" placeholder="e.g. lower back, left knee"
          value={data.injuries} onChange={e => set('injuries', e.target.value)} />
        <p className="text-xs text-zinc-400 mt-1">Separate multiple with commas</p>
      </div>
    </div>,

    // Step 1 — Goals
    <div key="goals" className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Your fitness goals</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Select all that apply.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {GOALS.map(({ key, label }) => {
          const active = data.fitness_goals.includes(key);
          return (
            <button key={key} type="button" onClick={() => toggleGoal(key)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium
                         text-left transition-all ${active
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}>
              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0
                              border ${active ? 'bg-brand-500 border-brand-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
                {active && <Check size={10} className="text-white" />}
              </div>
              {label}
            </button>
          );
        })}
      </div>
    </div>,

    // Step 2 — Training setup
    <div key="training" className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Training setup</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Tell us about your training environment.</p>
      <div>
        <label className="label">Training location</label>
        <div className="grid grid-cols-2 gap-2.5">
          {['gym', 'home'].map(loc => (
            <button key={loc} type="button" onClick={() => set('training_location', loc)}
              className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                data.training_location === loc
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}>
              {loc === 'gym' ? '🏋️ Gym' : '🏠 Home'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Days per week</label>
        <div className="flex gap-2 flex-wrap">
          {[2,3,4,5,6,7].map(d => (
            <button key={d} type="button" onClick={() => set('days_per_week', d)}
              className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-all ${
                data.days_per_week === d
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}>{d}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Available equipment</label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map(e => {
            const active = data.available_equipment.includes(e);
            return (
              <button key={e} type="button" onClick={() => toggleEquip(e)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}>{e}</button>
            );
          })}
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Logo className="w-9 h-9" />
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">FitNexus</span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= step ? 'bg-brand-500' : 'bg-zinc-200 dark:bg-zinc-700'
            }`} />
          ))}
        </div>

        <div className="card p-7">
          {steps[step]}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5
                          border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="btn-secondary flex items-center gap-1.5 disabled:opacity-0"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <span className="text-xs text-zinc-400">{step + 1} / {steps.length}</span>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} className="btn-primary flex items-center gap-1.5">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="btn-primary flex items-center gap-1.5">
                {loading ? 'Saving...' : <><Check size={16} /> Finish</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}