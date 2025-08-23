import { createContext, ReactNode, useContext, useState } from "react";

type Toast = {
  id: string;
  message: string;
  type?: "info" | "success" | "error";
};

type ToastContextType = {
  push: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((s) => [...s, { ...t, id }]);
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm w-full px-4 py-3 rounded border ${
              t.type === "success"
                ? "bg-green-900/80 border-green-700 text-green-200"
                : t.type === "error"
                ? "bg-red-900/80 border-red-700 text-red-200"
                : "bg-zinc-900/80 border-zinc-700 text-white"
            }`}
          >
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
