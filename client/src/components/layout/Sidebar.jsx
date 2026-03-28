import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, History, BookOpen,
  Apple, UtensilsCrossed, CheckSquare, TrendingUp,
  CalendarDays, Calendar, Trophy, StickyNote,
  Download, Zap, X, Settings, Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import Logo from '../ui/Logo';
const NAV_GROUPS = [
  {
    label: 'Training',
    links: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
      { to: '/history', icon: History, label: 'History' },
      { to: '/exercises', icon: BookOpen, label: 'Exercises' },
    ],
  },
  {
    label: 'Nutrition',
    links: [
      { to: '/nutrition', icon: Apple, label: 'Nutrition' },
      { to: '/meal-plans', icon: UtensilsCrossed, label: 'Meal Plans' },
    ],
  },
  {
    label: 'Lifestyle',
    links: [
      { to: '/habits', icon: CheckSquare, label: 'Habits' },
      { to: '/progress', icon: TrendingUp, label: 'Progress' },
      { to: '/schedule', icon: CalendarDays, label: 'Schedule' },
      { to: '/calendar', icon: Calendar, label: 'Calendar' },
    ],
  },
  {
    label: 'More',
    links: [
      { to: '/achievements', icon: Trophy, label: 'Achievements' },
      { to: '/notes', icon: StickyNote, label: 'Notes' },
      { to: '/reviews', icon: Star, label: 'Rate Us' },
      { to: '/export', icon: Download, label: 'Export' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

function Avatar({ user }) {
  const [imgError, setImgError] = useState(false);
  const showImg = user?.avatar_url && !imgError;

  return (
    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0
                    flex items-center justify-center bg-brand-500
                    ring-2 ring-gray-100 dark:ring-gray-800">
      {showImg ? (
        <img
          src={`http://localhost:5000${user.avatar_url}`}
          alt="avatar"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-xs font-bold text-white">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </span>
      )}
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <aside className={`
      fixed top-0 left-0 z-30 h-full w-[260px]
      bg-white dark:bg-[#09090b]
      border-r border-zinc-200/50 dark:border-zinc-800/80
      flex flex-col
      transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
      ${open ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
      {/* ── Logo ── */}
      <div className="flex items-center justify-between h-[72px] px-6
                      border-b border-zinc-200/50 dark:border-zinc-800/80
                      flex-shrink-0">
        <button
          onClick={() => { navigate('/dashboard'); onClose(); }}
          className="flex items-center gap-3
                     group hover:opacity-90 transition-opacity"
        >
          <div className="group-hover:scale-105 transition-transform duration-300">
            <Logo className="w-10 h-10" />
          </div>
          <span className="text-xl font-extrabold text-zinc-900
                           dark:text-zinc-50 tracking-tight">
            FitNexus
          </span>
        </button>
        <button onClick={onClose}
          className="lg:hidden p-2 rounded-xl text-zinc-400
                     hover:bg-zinc-100 dark:hover:bg-zinc-800/60
                     transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-4 py-6
                      overflow-y-auto scrollbar-hide space-y-6">
        {NAV_GROUPS.map(({ label, links }) => (
          <div key={label}>
            <p className="px-3 mb-2 text-[10px] font-bold
                           text-zinc-400 dark:text-zinc-500
                           uppercase tracking-widest">
              {label}
            </p>
            <div className="space-y-1">
              {links.map(({ to, icon: Icon, label: lbl }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span>{lbl}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      {user && (
        <div className="px-4 py-4 border-t border-zinc-200/50
                        dark:border-zinc-800/80 flex-shrink-0 bg-white/50 dark:bg-[#0f0f13]/30">
          <NavLink
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl p-2.5
                       hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80
                       transition-colors group"
          >
            <Avatar user={user} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900
                             dark:text-zinc-100 truncate
                             group-hover:text-brand-600
                             dark:group-hover:text-brand-400
                             transition-colors">
                {user.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {user.email}
              </p>
            </div>
            <Settings size={16}
              className="text-zinc-400 dark:text-zinc-500
                         group-hover:text-brand-500 group-hover:rotate-45
                         transition-all duration-300 flex-shrink-0" />
          </NavLink>
        </div>
      )}
    </aside>
  );
}