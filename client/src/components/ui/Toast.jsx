import { useEffect } from 'react';
import {
  X, Trophy, CheckCircle2, AlertCircle,
  Info, Flame,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const TOAST_STYLES = {
  achievement: {
    border: 'border-amber-200/50 dark:border-amber-500/30',
    icon:   <Trophy size={18} className="text-amber-500 drop-shadow-sm" />,
    bar:    'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  },
  success: {
    border: 'border-emerald-200/50 dark:border-emerald-500/30',
    icon:   <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-sm" />,
    bar:    'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  },
  error: {
    border: 'border-rose-200/50 dark:border-rose-500/30',
    icon:   <AlertCircle size={18} className="text-rose-500 drop-shadow-sm" />,
    bar:    'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
  },
  warning: {
    border: 'border-amber-200/50 dark:border-amber-500/30',
    icon:   <Flame size={18} className="text-amber-500 drop-shadow-sm" />,
    bar:    'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  },
  info: {
    border: 'border-brand-200/50 dark:border-brand-500/30',
    icon:   <Info size={18} className="text-brand-500 drop-shadow-sm" />,
    bar:    'bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]',
  },
};

function Toast({ toast }) {
  const { dismissToast } = useNotifications();
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  return (
    <div className={`relative flex items-start gap-4 w-80 sm:w-80 
                     px-4 py-4 rounded-2xl glass-panel shadow-xl
                     ${style.border}
                     ${toast.isExiting ? 'animate-slide-out' : 'animate-pop-in'} overflow-hidden origin-bottom-right`}>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full ${style.bar} animate-[shrink_4s_linear_forwards]`}
          style={{ animation: 'shrink 4s linear forwards' }}
        />
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-white dark:bg-[#1a1a20] shadow-sm flex items-center justify-center">
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => dismissToast(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-all active:scale-95"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useNotifications();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]
                    flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
}