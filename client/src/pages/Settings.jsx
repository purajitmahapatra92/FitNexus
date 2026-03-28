import { useState, useEffect, useRef } from 'react';
import {
  Save, User, Target, Lock, Check,
  Camera, Eye, EyeOff, Shield,
  Droplets, Zap,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'password', label: 'Password', icon: Lock },
];

// ── Save button ───────────────────────────────────────────────
function SaveBtn({ loading, saved }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`flex items-center gap-2 px-5 py-2.5
                  rounded-xl font-semibold text-sm
                  transition-all duration-200
                  disabled:opacity-60
        ${saved
          ? 'bg-green-500 text-white shadow-[0_2px_8px_0_rgb(34_197_94_/_0.3)]'
          : 'bg-brand-500 hover:bg-brand-600 text-white shadow-[0_2px_8px_0_rgb(99_102_241_/_0.3)] hover:shadow-[0_4px_12px_0_rgb(99_102_241_/_0.4)] hover:-translate-y-0.5'
        }`}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white
                          border-t-transparent rounded-full
                          animate-spin" />
          Saving...
        </>
      ) : saved ? (
        <>
          <Check size={15} />
          Saved!
        </>
      ) : (
        <>
          <Save size={15} />
          Save changes
        </>
      )}
    </button>
  );
}

// ── Section divider ───────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold text-zinc-400
                   dark:text-zinc-500 uppercase tracking-widest
                   mb-3 mt-1">
      {children}
    </p>
  );
}

// ── Avatar upload ─────────────────────────────────────────────
function AvatarSection() {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);
  const [hover, setHover] = useState(false);
  const inputRef = useRef(null);

  const getBaseUrl = () => {
    return (api.defaults.baseURL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  };

  const avatarUrl = preview ||
    (user?.avatar_url && !imgError
      ? `${getBaseUrl()}${user.avatar_url}`
      : null);

  const handleFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    setError('');
    setImgError(false);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // updateUser persists to localStorage so avatar survives re-renders
      updateUser({ avatar_url: data.avatar_url });
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Max 3MB.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-5 p-4
                    bg-zinc-50 dark:bg-zinc-800/40
                    rounded-2xl border border-zinc-100
                    dark:border-zinc-800 mb-5">
      {/* Avatar with hover overlay */}
      <div
        className="relative flex-shrink-0 cursor-pointer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => inputRef.current?.click()}
      >
        <div className="w-20 h-20 rounded-2xl overflow-hidden
                        ring-4 ring-white dark:ring-gray-900
                        shadow-md transition-all duration-200
                        flex items-center justify-center bg-brand-500">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={() => {
                setImgError(true);
                setPreview(null);
              }}
            />
          ) : (
            <span className="text-2xl font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className={`absolute inset-0 rounded-2xl
                         bg-black/50 flex items-center
                         justify-center transition-all duration-200
          ${hover || uploading ? 'opacity-100' : 'opacity-0'}`}>
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white
                            border-t-transparent rounded-full
                            animate-spin" />
          ) : (
            <Camera size={18} className="text-white" />
          )}
        </div>

        {/* Camera badge */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6
                        bg-brand-500 rounded-full flex items-center
                        justify-center shadow-sm border-2
                        border-white dark:border-zinc-900">
          <Camera size={11} className="text-white" />
        </div>

        <input ref={inputRef} type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden" onChange={handleFile} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
          {user?.name}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5 truncate">
          {user?.email}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-brand-500 hover:text-brand-600
                     font-medium mt-2 transition-colors
                     disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Change photo'}
        </button>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
        <p className="text-xs text-zinc-400 mt-0.5">
          JPG, PNG or WebP · Max 3MB
        </p>
      </div>
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────
function ProfileTab() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: '', age: '', gender: '',
    height_cm: '', weight_kg: '',
    body_fat_pct: '',
    experience_level: 'beginner',
    training_location: 'gym',
    days_per_week: 4,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/profile').then(({ data }) => {
      setForm({
        name: data.name || '',
        age: data.age || '',
        gender: data.gender || '',
        height_cm: data.height_cm || '',
        weight_kg: data.weight_kg || '',
        body_fat_pct: data.body_fat_pct || '',
        experience_level: data.experience_level || 'beginner',
        training_location: data.training_location || 'gym',
        days_per_week: data.days_per_week || 4,
      });
    }).catch(console.error);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/profile', {
        ...form,
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        body_fat_pct: form.body_fat_pct ? Number(form.body_fat_pct) : null,
      });
      updateUser({ name: form.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <AvatarSection />

      {/* Personal info */}
      <div>
        <SectionLabel>Personal information</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Full name</label>
            <input className="input" value={form.name}
              onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Age</label>
            <input type="number" className="input" placeholder="25"
              value={form.age}
              onChange={e => set('age', e.target.value)} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender}
              onChange={e => set('gender', e.target.value)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input type="number" className="input" placeholder="175"
              value={form.height_cm}
              onChange={e => set('height_cm', e.target.value)} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" className="input" placeholder="75"
              value={form.weight_kg}
              onChange={e => set('weight_kg', e.target.value)} />
          </div>
          <div>
            <label className="label">Body fat % (optional)</label>
            <input type="number" className="input" placeholder="20"
              min="1" max="60" step="0.1"
              value={form.body_fat_pct}
              onChange={e => set('body_fat_pct', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Training preferences */}
      <div>
        <SectionLabel>Training preferences</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Experience level</label>
            <select className="input" value={form.experience_level}
              onChange={e => set('experience_level', e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="label">Training location</label>
            <select className="input" value={form.training_location}
              onChange={e => set('training_location', e.target.value)}>
              <option value="gym">Gym</option>
              <option value="home">Home</option>
            </select>
          </div>
          <div>
            <label className="label">Days per week</label>
            <select className="input" value={form.days_per_week}
              onChange={e =>
                set('days_per_week', Number(e.target.value))
              }>
              {[2, 3, 4, 5, 6, 7].map(d => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-2 border-t
                      border-zinc-100 dark:border-zinc-800">
        <SaveBtn loading={loading} saved={saved} />
      </div>
    </form>
  );
}

// ── Goals tab ─────────────────────────────────────────────────
function GoalsTab() {
  const [form, setForm] = useState({
    calories_goal: 2000,
    protein_goal: 150,
    carbs_goal: 200,
    fat_goal: 70,
    water_goal_ml: 2500,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/nutrition/goals'),
      api.get('/profile'),
    ]).then(([n, p]) => {
      setForm({
        calories_goal: n.data.calories_goal || 2000,
        protein_goal: n.data.protein_goal || 150,
        carbs_goal: n.data.carbs_goal || 200,
        fat_goal: n.data.fat_goal || 70,
        water_goal_ml: p.data.water_goal_ml || 2500,
      });
    }).catch(console.error);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: Number(v) }));

  const totalMacroCalories =
    form.protein_goal * 4 +
    form.carbs_goal * 4 +
    form.fat_goal * 9;

  const calDiff = Math.abs(totalMacroCalories - form.calories_goal);
  const calMatch = calDiff < 50;

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await Promise.all([
        api.put('/nutrition/goals', {
          calories_goal: form.calories_goal,
          protein_goal: form.protein_goal,
          carbs_goal: form.carbs_goal,
          fat_goal: form.fat_goal,
        }),
        api.put('/profile', {
          water_goal_ml: form.water_goal_ml,
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-6">

      {/* Calorie goal */}
      <div>
        <SectionLabel>Calorie target</SectionLabel>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Daily calorie goal</label>
            <span className="text-xs font-bold text-zinc-900
                             dark:text-zinc-100 tabular-nums">
              {form.calories_goal} kcal
            </span>
          </div>
          <input type="number" className="input"
            min="500" max="10000"
            value={form.calories_goal}
            onChange={e => set('calories_goal', e.target.value)}
          />
          {/* Macro vs calorie match indicator */}
          <div className={`flex items-center gap-2 mt-2 text-xs
                           font-medium transition-colors
            ${calMatch ? 'text-green-500' : 'text-amber-500'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center
                             justify-center flex-shrink-0
              ${calMatch
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-amber-100 dark:bg-amber-900/30'
              }`}>
              {calMatch
                ? <Check size={10} />
                : <span className="text-2xs font-bold">!</span>
              }
            </div>
            {calMatch
              ? `Macros match — ${totalMacroCalories} kcal`
              : `Macros add up to ${totalMacroCalories} kcal — ${totalMacroCalories > form.calories_goal
                ? 'over' : 'under'
              } by ${calDiff} kcal`
            }
          </div>
        </div>
      </div>

      {/* Macro goals */}
      <div>
        <SectionLabel>Macro targets</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              key: 'protein_goal', label: 'Protein', unit: 'g',
              color: 'bg-brand-500', text: 'text-brand-500',
              max: 400, kcalPer: 4
            },
            {
              key: 'carbs_goal', label: 'Carbs', unit: 'g',
              color: 'bg-green-500', text: 'text-green-500',
              max: 600, kcalPer: 4
            },
            {
              key: 'fat_goal', label: 'Fat', unit: 'g',
              color: 'bg-amber-500', text: 'text-amber-500',
              max: 200, kcalPer: 9
            },
          ].map(({ key, label, unit, color, text, max, kcalPer }) => (
            <div key={key}
              className="p-4 bg-zinc-50 dark:bg-zinc-800/40
                         rounded-xl border border-zinc-100
                         dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold ${text}`}>
                  {label}
                </span>
                <span className="text-xs text-zinc-400 tabular-nums">
                  {Math.round(form[key] * kcalPer)} kcal
                </span>
              </div>
              <input type="number" className="input text-center
                                              font-bold text-lg py-2
                                              mb-3"
                min="0" max={max}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
              />
              <div className="w-full bg-zinc-200 dark:bg-zinc-700
                              rounded-full h-1.5 overflow-hidden">
                <div
                  className={`${color} h-1.5 rounded-full
                               transition-all duration-300`}
                  style={{
                    width: `${Math.min(100, (form[key] / max) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-2xs text-zinc-400 mt-1.5 text-right">
                {form[key]}{unit} / {max}{unit} max
              </p>
            </div>
          ))}
        </div>

        {/* Macro breakdown bar */}
        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/40
                        rounded-xl border border-zinc-100
                        dark:border-zinc-800">
          <p className="text-xs font-semibold text-zinc-500
                         dark:text-zinc-400 uppercase tracking-wide
                         mb-3">
            Calorie breakdown
          </p>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {[
              { key: 'protein_goal', color: 'bg-brand-500', mult: 4 },
              { key: 'carbs_goal', color: 'bg-green-500', mult: 4 },
              { key: 'fat_goal', color: 'bg-amber-500', mult: 9 },
            ].map(({ key, color, mult }) => {
              const pct = totalMacroCalories > 0
                ? (form[key] * mult / totalMacroCalories) * 100 : 0;
              return (
                <div key={key}
                  className={`${color} h-full transition-all
                               duration-300`}
                  style={{ width: `${pct}%` }} />
              );
            })}
          </div>
          <div className="flex items-center gap-5 mt-2.5">
            {[
              {
                label: 'Protein', color: 'bg-brand-500',
                pct: totalMacroCalories > 0
                  ? Math.round((form.protein_goal * 4 / totalMacroCalories) * 100) : 0
              },
              {
                label: 'Carbs', color: 'bg-green-500',
                pct: totalMacroCalories > 0
                  ? Math.round((form.carbs_goal * 4 / totalMacroCalories) * 100) : 0
              },
              {
                label: 'Fat', color: 'bg-amber-500',
                pct: totalMacroCalories > 0
                  ? Math.round((form.fat_goal * 9 / totalMacroCalories) * 100) : 0
              },
            ].map(({ label, color, pct }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-zinc-500
                                  dark:text-zinc-400">
                  {label} {pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Water goal */}
      <div>
        <SectionLabel>Hydration</SectionLabel>
        <div className="p-4 bg-blue-50/60 dark:bg-blue-900/10
                        rounded-xl border border-blue-100
                        dark:border-blue-900/30">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30
                            rounded-lg flex items-center justify-center">
              <Droplets size={14} className="text-blue-500" />
            </div>
            <label className="label mb-0 text-blue-700
                              dark:text-blue-300">
              Daily water goal
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input type="number" className="input flex-1"
              min="500" max="6000" step="250"
              value={form.water_goal_ml}
              onChange={e => set('water_goal_ml', e.target.value)}
            />
            <span className="text-sm text-zinc-500
                             dark:text-zinc-400 whitespace-nowrap">
              ml / day
            </span>
          </div>
          <p className="text-xs text-blue-500 dark:text-blue-400
                         mt-2 font-medium">
            {(form.water_goal_ml / 1000).toFixed(1)}L per day ·{' '}
            ~{Math.round(form.water_goal_ml / 250)} glasses of 250ml
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-2 border-t
                      border-zinc-100 dark:border-zinc-800">
        <SaveBtn loading={loading} saved={saved} />
      </div>
    </form>
  );
}

// ── Password tab ──────────────────────────────────────────────
function PasswordTab() {
  const [form, setForm] = useState({
    current: '', newPw: '', confirm: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const strength = pw => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const pwStrength = strength(form.newPw);
  const strengthMeta = [
    null,
    { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' },
    { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' },
    { label: 'Good', color: 'bg-yellow-500', text: 'text-yellow-500' },
    { label: 'Strong', color: 'bg-green-500', text: 'text-green-500' },
    { label: 'Very strong', color: 'bg-green-600', text: 'text-green-600' },
  ][pwStrength];

  const pwMatch = form.confirm
    ? form.newPw === form.confirm : null;

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (form.newPw.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (form.newPw !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/profile/password', {
        current_password: form.current,
        new_password: form.newPw,
      });
      setForm({ current: '', newPw: '', confirm: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-6">

      {/* Security info banner */}
      <div className="flex items-start gap-3 p-4
                      bg-brand-50 dark:bg-brand-900/20
                      rounded-xl border border-brand-100
                      dark:border-brand-800/60">
        <div className="w-7 h-7 bg-brand-100 dark:bg-brand-900/40
                        rounded-lg flex items-center justify-center
                        flex-shrink-0 mt-0.5">
          <Shield size={14} className="text-brand-500" />
        </div>
        <p className="text-xs text-brand-600/80 dark:text-brand-400/80
                       leading-relaxed">
          Choose a strong password with at least 8 characters,
          a number, and a special character.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl text-sm
                        bg-red-50 dark:bg-red-900/20
                        border border-red-100 dark:border-red-800
                        text-red-600 dark:text-red-400
                        animate-slide-down">
          {error}
        </div>
      )}

      <div>
        <SectionLabel>Current password</SectionLabel>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            required className="input pr-10"
            placeholder="••••••••"
            value={form.current}
            onChange={e => setForm(f => ({
              ...f, current: e.target.value,
            }))}
          />
          <button
            type="button"
            onClick={() => setShowCurrent(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-zinc-400 hover:text-zinc-600
                       dark:hover:text-zinc-300 transition-colors"
          >
            {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div>
        <SectionLabel>New password</SectionLabel>
        <div className="relative mb-2">
          <input
            type={showNew ? 'text' : 'password'}
            required className="input pr-10"
            placeholder="Min. 6 characters"
            value={form.newPw}
            onChange={e => setForm(f => ({
              ...f, newPw: e.target.value,
            }))}
          />
          <button
            type="button"
            onClick={() => setShowNew(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-zinc-400 hover:text-zinc-600
                       dark:hover:text-zinc-300 transition-colors"
          >
            {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {/* Strength meter */}
        {form.newPw && (
          <div className="space-y-1.5 animate-slide-down">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all
                               duration-300
                    ${i <= pwStrength
                      ? strengthMeta?.color
                      : 'bg-zinc-100 dark:bg-zinc-800'
                    }`} />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold
                ${strengthMeta?.text || 'text-zinc-400'}`}>
                {strengthMeta?.label || ''}
              </p>
              {/* Requirement hints */}
              <div className="flex items-center gap-2">
                {[
                  { ok: form.newPw.length >= 6, label: '6+ chars' },
                  { ok: /[A-Z]/.test(form.newPw), label: 'Uppercase' },
                  { ok: /[0-9]/.test(form.newPw), label: 'Number' },
                  { ok: /[^A-Za-z0-9]/.test(form.newPw), label: 'Symbol' },
                ].map(({ ok, label }) => (
                  <span key={label}
                    className={`text-2xs flex items-center gap-0.5
                                transition-colors
                      ${ok
                        ? 'text-green-500'
                        : 'text-zinc-300 dark:text-zinc-600'
                      }`}>
                    <Check size={9} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <SectionLabel>Confirm new password</SectionLabel>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            required className="input pr-10"
            placeholder="••••••••"
            value={form.confirm}
            onChange={e => setForm(f => ({
              ...f, confirm: e.target.value,
            }))}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-zinc-400 hover:text-zinc-600
                       dark:hover:text-zinc-300 transition-colors"
          >
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {/* Match indicator */}
        {form.confirm && (
          <p className={`text-xs mt-1.5 font-semibold flex items-center
                         gap-1 animate-slide-down
            ${pwMatch ? 'text-green-500' : 'text-red-500'}`}>
            {pwMatch ? (
              <><Check size={11} /> Passwords match</>
            ) : (
              <><span className="font-bold">✕</span> Passwords do not match</>
            )}
          </p>
        )}
      </div>

      <div className="flex justify-center pt-2 border-t
                      border-zinc-100 dark:border-zinc-800">
        <SaveBtn loading={loading} saved={saved} />
      </div>
    </form>
  );
}

// ── Main Settings page ────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          Manage your profile, goals, and account security.
        </p>
      </div>

      <div className="card overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-zinc-100
                        dark:border-zinc-800/60 bg-zinc-50/50
                        dark:bg-zinc-800/20">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-2
                          px-5 py-4 text-sm font-medium
                          transition-all duration-150 flex-1
                          justify-center
                ${tab === key
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              <Icon size={15} />
              {label}
              {/* Active underline */}
              {tab === key && (
                <span className="absolute bottom-0 left-0 right-0
                                  h-0.5 bg-brand-500
                                  rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'goals' && <GoalsTab />}
          {tab === 'password' && <PasswordTab />}
        </div>
      </div>
    </div>
  );
}