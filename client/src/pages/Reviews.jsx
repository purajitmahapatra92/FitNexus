import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';

export default function Reviews() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', role: '', text: '', rating: 5 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('fn_token') || localStorage.getItem('token');
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }
      
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0c0c0f] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={32} className="text-white fill-white" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Thank you!</h2>
          <p className="text-zinc-500 mt-2">Your review has been published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0c0c0f] flex items-center justify-center p-4 bg-grid">
      <div className="w-full max-w-md">
        <button
          onClick={() => {
            if (user) {
              navigate('/dashboard');
            } else {
              navigate('/');
            }
          }}
          className="flex items-center justify-center gap-3 mb-8 mx-auto hover:opacity-80 transition-opacity"
        >
          <Logo className="w-9 h-9" />
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">FitNexus</span>
        </button>

        <div className="card p-7">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Leave a Review
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Share your fitness journey with others
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text" required className="input" placeholder="Alex Johnson"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Role / Tagline</label>
              <input
                type="text" required className="input" placeholder="Intermediate lifter"
                value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Your Experience</label>
              <textarea
                required className="input min-h-[100px] py-3" placeholder="FitNexus helped me..."
                value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star} type="button" onClick={() => setForm(f => ({ ...f, rating: star }))}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={28}
                      className={star <= form.rating ? "text-amber-400 fill-amber-400" : "text-zinc-300 dark:text-zinc-700"}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <button type="submit" disabled={loading || error === 'You already submitted a review'} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Submitting...' : 'Publish Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
