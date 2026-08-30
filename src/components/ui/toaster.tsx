import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// Imperative helper for non-React contexts (e.g., utils)
let imperativeToast: ((t: Omit<Toast, 'id'>) => void) | null = null;
export function toast(t: Omit<Toast, 'id'>) {
  if (imperativeToast) imperativeToast(t);
  else console.warn('[Toast]', t.title, t.description);
}
export function setImperativeToast(fn: (t: Omit<Toast, 'id'>) => void) {
  imperativeToast = fn;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastFn = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2, 9);
      const newToast: Toast = { id, duration: 4000, ...t };
      setToasts((prev) => [...prev, newToast]);
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => dismiss(id), newToast.duration);
      }
    },
    [dismiss]
  );

  useEffect(() => {
    setImperativeToast(toastFn);
  }, [toastFn]);

  return (
    <ToastContext.Provider value={{ toasts, toast: toastFn, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto relative flex gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md
                ${t.type === 'success' ? 'bg-emerald-950/90 border-emerald-800 text-emerald-50' : ''}
                ${t.type === 'error' ? 'bg-red-950/90 border-red-800 text-red-50' : ''}
                ${t.type === 'warning' ? 'bg-amber-950/90 border-amber-800 text-amber-50' : ''}
                ${t.type === 'info' ? 'bg-neutral-900/90 border-neutral-700 text-neutral-50' : ''}`}
              role="alert"
              aria-live="polite"
            >
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-none">{t.title}</div>
                {t.description && (
                  <div className="text-xs opacity-80 mt-1 leading-snug">{t.description}</div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4 opacity-60" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
