import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'fn_user';

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveStoredUser(user) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadStoredUser());
  const [loading, setLoading] = useState(true);

  const setUserAndPersist = (updater) => {
    setUser(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStoredUser(next);
      return next;
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('fn_token');
    if (!token) { setLoading(false); return; }

    // /auth/me gives basic user, /profile gives full profile with avatar_url
    Promise.all([
      api.get('/auth/me'),
      api.get('/profile'),
    ])
      .then(([meRes, profileRes]) => {
        const merged = {
          ...meRes.data,
          avatar_url: profileRes.data.avatar_url || null,
          weight_kg: profileRes.data.weight_kg || null,
          height_cm: profileRes.data.height_cm || null,
        };
        setUserAndPersist(merged);
      })
      .catch(() => {
        localStorage.removeItem('fn_token');
        saveStoredUser(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('fn_token', data.token);

    // Fetch full profile including avatar_url
    try {
      const profileRes = await api.get('/profile');
      const merged = {
        ...data.user,
        avatar_url: profileRes.data.avatar_url || null,
        weight_kg: profileRes.data.weight_kg || null,
        height_cm: profileRes.data.height_cm || null,
      };
      setUserAndPersist(merged);
      return merged;
    } catch {
      setUserAndPersist(data.user);
      return data.user;
    }
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('fn_token', data.token);
    setUserAndPersist(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { }
    localStorage.removeItem('fn_token');
    saveStoredUser(null);
    setUser(null);
  };

  const updateUser = updates =>
    setUserAndPersist(prev => prev ? { ...prev, ...updates } : prev);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};