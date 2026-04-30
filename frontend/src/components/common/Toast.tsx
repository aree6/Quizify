import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

interface ToastItem {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, action }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 bg-near-black text-white text-sm rounded-lg shadow-xl"
          >
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="shrink-0 text-lime font-semibold hover:underline cursor-pointer"
                onClick={() => {
                  t.action!.onClick();
                  remove(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
