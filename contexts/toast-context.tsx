"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <Check size={15} />,
  error: <X size={15} />,
  warning: <AlertCircle size={15} />,
  info: <Info size={15} />,
};

const COLORS: Record<ToastVariant, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: "#f0fdf4", border: "#86efac", icon: "#16a34a", text: "#14532d" },
  error: { bg: "#fef2f2", border: "#fecaca", icon: "#dc2626", text: "#991b1b" },
  warning: { bg: "#fffbeb", border: "#fde68a", icon: "#d97706", text: "#92400e" },
  info: { bg: "#eff6ff", border: "#bfdbfe", icon: "#2563eb", text: "#1e40af" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  function dismiss(id: string) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          const c = COLORS[t.variant];
          return (
            <div
              key={t.id}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: c.bg, border: `1px solid ${c.border}`,
                borderRadius: "10px", padding: "12px 16px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                maxWidth: "380px", minWidth: "260px",
                pointerEvents: "auto",
                animation: "slideUpFade 0.2s ease-out",
              }}
            >
              <span style={{ color: c.icon, flexShrink: 0 }}>{ICONS[t.variant]}</span>
              <p style={{ fontSize: "14px", fontWeight: 500, color: c.text, flex: 1 }}>
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                style={{ color: c.icon, opacity: 0.6, cursor: "pointer", flexShrink: 0, background: "none", border: "none", padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
