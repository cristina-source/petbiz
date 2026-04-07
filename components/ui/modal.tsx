"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div
        className={cn(
          "relative w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl animate-fade-in",
          sizes[size],
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-6 pb-4 border-b border-[var(--border)]">
            <div>
              {title && (
                <h2 id={titleId} className="text-lg font-semibold text-[var(--app-text)]">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="text-sm text-[var(--app-text-muted)] mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="ml-4 p-1.5 rounded-[var(--radius-sm)] text-[var(--app-text-muted)] hover:bg-[var(--gray-100)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
