import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };
const COLORS = {
  success: 'border-mint/40 text-mint',
  error: 'border-rose/40 text-rose',
  info: 'border-cyan/40 text-cyan',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((type, text) => {
    const id = ++idRef.current;
    setToasts((list) => [...list, { id, type, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3800);
  }, []);

  const toast = {
    success: (text) => push('success', text),
    error: (text) => push('error', text),
    info: (text) => push('info', text),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[1200] flex flex-col items-center gap-2 px-4">
        {toasts.map(({ id, type, text }) => {
          const Icon = ICONS[type];
          return (
            <div
              key={id}
              className={`card pointer-events-auto flex max-w-md items-center gap-2.5 px-4 py-3 text-sm font-medium animate-rise ${COLORS[type]}`}
            >
              <Icon size={17} className="shrink-0" />
              <span className="text-ink">{text}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
