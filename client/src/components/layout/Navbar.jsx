import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Sun, Moon, LogOut, ChevronDown,
  Bell, Trophy, CheckCircle2, AlertCircle,
  Info, Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const NOTIF_ICONS = {
  achievement: <Trophy size={16} className="text-amber-500" />,
  success: <CheckCircle2 size={16} className="text-emerald-500" />,
  error: <AlertCircle size={16} className="text-rose-500" />,
  warning: <Flame size={16} className="text-amber-500" />,
  info: <Info size={16} className="text-brand-500" />,
};

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

function Avatar({ user, size = 7 }) {
  const sizeClass = `w-${size} h-${size}`;
  const textClass = size >= 10 ? 'text-lg' : 'text-xs';
  const [imgError, setImgError] = useState(false);

  const showImg = user?.avatar_url && !imgError;

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden
                     flex-shrink-0 flex items-center justify-center
                     bg-brand-500`}>
      {showImg ? (
        <img
          src={`http://localhost:5000${user.avatar_url}`}
          alt="avatar"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`${textClass} font-semibold text-white`}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </span>
      )}
    </div>
  );
}

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const profileRef = useRef(null);
  const bellRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-[72px]
                       bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md
                       border-b border-zinc-200/50 dark:border-zinc-800/80
                       flex items-center px-4 md:px-8 gap-4 shadow-sm transition-colors">

      <button onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-zinc-500 hover:bg-zinc-100
                   dark:text-zinc-400 dark:hover:bg-zinc-800/80 transition-colors">
        <Menu size={22} />
      </button>

      <div className="flex-1" />
      <button onClick={toggleTheme}
        className="p-2.5 rounded-xl hover:bg-zinc-100 hover:scale-105 active:scale-95
                   dark:hover:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 transition-all">
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* ── Bell ── */}
      <div className="relative" ref={bellRef}>
        <button
          onClick={() => {
            setBellOpen(o => !o);
            if (!bellOpen) markAllRead();
          }}
          className="relative p-2.5 rounded-xl hover:bg-zinc-100 hover:scale-105 active:scale-95
                     dark:hover:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 transition-all"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0f0f13] animate-pulse-glow" />
          )}
        </button>

        {bellOpen && (
          <div className="absolute right-0 top-full mt-3 w-80 sm:w-96
                          glass-panel rounded-2xl shadow-2xl z-50 animate-pop-in
                          overflow-hidden origin-top-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Notifications</p>
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs font-semibold text-zinc-500 hover:text-rose-500 transition-colors">
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto scrollbar-hide py-1">
              {notifications.length === 0 ? (
                <div className="px-5 py-10 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-3">
                    <Bell size={28} className="text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">All caught up!</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Complete activities to receive notifications</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((n, i) => (
                  <button key={n.id}
                    onClick={() => {
                      markRead(n.id);
                      if (n.type === 'achievement') {
                        navigate('/achievements');
                        setBellOpen(false);
                      }
                    }}
                    className={`group w-full flex items-start gap-4 px-5 py-3 text-left transition-all
                      ${!n.read ? 'bg-brand-50/50 dark:bg-brand-500/5' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'}
                      animate-slide-up`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1a20] shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      {NOTIF_ICONS[n.type] || NOTIF_ICONS.info}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</p>
                      {n.message && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{n.message}</p>}
                      <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-1.5 uppercase tracking-wider">{timeAgo(n.time)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2.5 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                  </button>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-5 py-3 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <button
                  onClick={() => { navigate('/achievements'); setBellOpen(false); }}
                  className="w-full text-xs font-bold text-center text-brand-500 hover:text-brand-600 transition-colors"
                >
                  View all activity
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Profile dropdown ── */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(o => !o)}
          className="flex items-center gap-3 pl-2 pr-3 py-1.5
                     rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/80
                     transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
        >
          <Avatar user={user} size={8} />
          <span className="hidden sm:block text-sm font-semibold text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">
            {user?.name}
          </span>
          <ChevronDown size={14} className={`text-zinc-400 hidden sm:block transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-full mt-3 w-56
                          glass-panel rounded-2xl shadow-2xl animate-pop-in
                          origin-top-right z-50 overflow-hidden">
            <div className="flex flex-col items-center gap-2 px-5 py-5
                            bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <Avatar user={user} size={14} />
              <div className="text-center mt-1">
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">{user?.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                           text-sm font-medium text-rose-600 dark:text-rose-400
                           hover:bg-rose-50 dark:hover:bg-rose-500/10
                           hover:translate-x-1 transition-all"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}