import React from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  return (
    <div
      className="fixed bottom-5 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm z-60 flex flex-col items-center sm:items-end gap-2.5 sm:gap-3 pointer-events-none"
      aria-live="polite"
      role="region"
      aria-label="Action notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 36, scale: 0.95 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: 'spring',
                  stiffness: 420,
                  damping: 28,
                },
              }}
              exit={{
                opacity: 0,
                y: 36,
                scale: 0.95,
                transition: {
                  duration: 0.22,
                  ease: [0.16, 1, 0.3, 1],
                },
              }}
              className="w-full max-w-md sm:max-w-sm pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 bg-[#14141a]/98 backdrop-blur-2xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl text-white relative overflow-hidden group select-none"
            >
              {/* Vibrant Accent Color Bar on Left Edge */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isSuccess ? 'bg-[#46d369]' : isError ? 'bg-[#e50914]' : 'bg-sky-400'
                }`}
              />

              {/* Status Indicator Icon */}
              <div className="shrink-0 mt-0.5 ml-1">
                {isSuccess && (
                  <div className="w-6 h-6 rounded-full bg-[#46d369]/20 flex items-center justify-center text-[#46d369] shadow-inner">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {isError && (
                  <div className="w-6 h-6 rounded-full bg-[#e50914]/20 flex items-center justify-center text-[#e50914] shadow-inner">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {!isSuccess && !isError && (
                  <div className="w-6 h-6 rounded-full bg-sky-400/20 flex items-center justify-center text-sky-400 shadow-inner">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Title & Description Content Block */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="text-[11px] sm:text-xs text-neutral-300 mt-0.5 sm:mt-1 leading-relaxed break-words">
                    {toast.description}
                  </p>
                )}
              </div>

              {/* Close / Dismiss Action */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer shrink-0 ml-auto"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
