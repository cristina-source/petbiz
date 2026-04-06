"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    background: "var(--brand-600)",
    color: "white",
    border: "none",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  secondary: {
    background: "var(--gray-100)",
    color: "var(--app-text)",
    border: "1.5px solid var(--border)",
  },
  outline: {
    background: "transparent",
    color: "var(--app-text)",
    border: "1.5px solid var(--border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--app-text)",
    border: "none",
  },
  danger: {
    background: "#dc2626",
    color: "white",
    border: "none",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
};

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { height: "32px", padding: "0 12px", fontSize: "13px", gap: "6px" },
  md: { height: "38px", padding: "0 16px", fontSize: "14px", gap: "8px" },
  lg: { height: "44px", padding: "0 24px", fontSize: "15px", gap: "8px" },
  icon: { height: "36px", width: "36px", padding: "0", fontSize: "14px" },
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANT_STYLES;
  size?: keyof typeof SIZE_STYLES;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, style, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
    const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.md;
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          fontWeight: 600,
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.5 : 1,
          transition: "background 0.15s ease, opacity 0.15s ease",
          fontFamily: "inherit",
          ...variantStyle,
          ...sizeStyle,
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            if (variant === "primary") e.currentTarget.style.background = "var(--brand-700)";
            else if (variant === "secondary" || variant === "outline") e.currentTarget.style.background = "var(--gray-200)";
            else if (variant === "danger") e.currentTarget.style.background = "#b91c1c";
          }
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = variantStyle.background as string;
          }
          onMouseLeave?.(e);
        }}
        {...props}
      >
        {loading && (
          <svg
            style={{ animation: "spin 1s linear infinite", height: "16px", width: "16px", flexShrink: 0 }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle opacity={0.25} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path opacity={0.75} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
