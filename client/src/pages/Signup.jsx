import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';

export default function Signup() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const submit = async e => {
    e.preventDefault(); setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0c0c0f]
                    flex items-center justify-center p-4 bg-grid">
      <div className="w-full max-w-sm">

        {/* Logo — clicks back to landing */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-3 mb-8
                     mx-auto hover:opacity-80 transition-opacity"
        >
          <Logo className="w-9 h-9" />
          <span className="text-2xl font-semibold
                           text-zinc-900 dark:text-zinc-100">
            FitNexus
          </span>
        </button>

        <div className="card p-7">
          <h1 className="text-xl font-semibold
                         text-zinc-900 dark:text-zinc-100 mb-1">
            Create account
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Start your fitness journey
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm
                            bg-red-50 dark:bg-red-900/20
                            border border-red-100 dark:border-red-800
                            text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                type="text" required className="input"
                placeholder="Alex Johnson"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email" required className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required className="input pr-10"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-zinc-400 hover:text-zinc-600
                             dark:hover:text-zinc-300"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 mt-1"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500
                      dark:text-zinc-400 mt-5">
          Already have an account?{' '}
          <Link to="/login"
            className="text-brand-500 hover:text-brand-600 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}