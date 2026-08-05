import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 6000;
const MAX_TOASTS = 4;

let toastCounter = 0;

function createToastId() {
  toastCounter += 1;
  return `toast-${toastCounter}-${Date.now()}`;
}

function toastVariantClass(variant) {
  if (variant === 'warning') return 'border-l-amber-500';
  if (variant === 'success') return 'border-l-emerald-500';
  if (variant === 'info') return 'border-l-blue-500';
  return 'border-l-primary';
}

function ToastItem({ toast, onDismiss }) {
  return (
    <div
      role="status"
      className={`pointer-events-auto w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-gray-100 border-l-4 ${toastVariantClass(
        toast.variant,
      )} bg-white shadow-lg px-4 py-3 animate-toast-in`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => {
            toast.onClick?.();
            onDismiss(toast.id);
          }}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{toast.message}</p>
          )}
        </button>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 text-gray-400 hover:text-gray-600 p-0.5"
          aria-label="Fechar aviso"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, variant = 'info', onClick, duration = AUTO_DISMISS_MS }) => {
      const id = createToastId();

      setToasts((prev) => [{ id, title, message, variant, onClick }, ...prev].slice(0, MAX_TOASTS));

      if (duration > 0) {
        window.setTimeout(() => dismissToast(id), duration);
      }

      return id;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
}
