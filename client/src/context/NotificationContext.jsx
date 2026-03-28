import {
  createContext, useContext, useState,
  useCallback, useEffect,
} from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user }                      = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts,        setToasts]        = useState([]);

  // Load persisted notifications from localStorage on mount
  useEffect(() => {
    if (!user) return;
    const key = `fn_notifications_${user.id}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      setNotifications(saved);
    } catch { setNotifications([]); }
  }, [user]);

  // Persist to localStorage whenever notifications change
  useEffect(() => {
    if (!user) return;
    const key = `fn_notifications_${user.id}`;
    localStorage.setItem(key, JSON.stringify(notifications.slice(0, 50)));
  }, [notifications, user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Add a new notification + show a toast
  const notify = useCallback((notification) => {
    const id  = Date.now() + Math.random();
    const item = {
      id,
      title:    notification.title,
      message:  notification.message,
      type:     notification.type  || 'info', // success | warning | error | info | achievement
      icon:     notification.icon  || null,
      read:     false,
      time:     new Date().toISOString(),
    };

    setNotifications(prev => [item, ...prev]);
    setToasts(prev => [...prev, item]);

    // Auto-remove toast after 4s
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 4000);
  }, []);

  const markRead = useCallback(id => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissToast = useCallback(id => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  // Poll for new achievements every 30s
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const { data } = await api.get('/achievements/recent');
        if (!data.length) return;

        // Check if newest achievement is new (within last 35s)
        const latest = data[0];
        if (!latest?.earned_at) return;

        const earnedAt = new Date(latest.earned_at).getTime();
        const now      = Date.now();
        const age      = now - earnedAt;

        if (age < 35000) {
          // Check we haven't already notified for this one
          const key    = `fn_notified_${user.id}`;
          const notified = JSON.parse(localStorage.getItem(key) || '[]');
          if (!notified.includes(latest.key)) {
            notify({
              title:   'Achievement Unlocked!',
              message: `${latest.name} — +${latest.xp_value} XP`,
              type:    'achievement',
              icon:    'trophy',
            });
            localStorage.setItem(
              key, JSON.stringify([...notified, latest.key].slice(-20))
            );
          }
        }
      } catch { /* silent */ }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [user, notify]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      toasts, notify,
      markRead, markAllRead, clearAll,
      dismissToast,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};