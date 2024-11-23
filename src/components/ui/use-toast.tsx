import * as React from "react";
import { cn } from "../../lib/utils";

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

const ToastContext = React.createContext<{
  toast: (props: ToastProps) => void;
}>({
  toast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback((props: ToastProps) => {
    setToasts((prev) => [...prev, props]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t !== props));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
        {toasts.map((toast, i) => (
          <div
            key={i}
            className={cn(
              "bg-white rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out",
              "animate-in slide-in-from-right-full"
            )}
          >
            {toast.title && (
              <div className="font-semibold">{toast.title}</div>
            )}
            {toast.description && (
              <div className="text-sm text-gray-500">{toast.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export const toast = (props: ToastProps) => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("toast", { detail: props });
    window.dispatchEvent(event);
  }
};