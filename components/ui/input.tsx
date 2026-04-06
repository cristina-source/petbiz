import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: "13px", fontWeight: 500, color: "var(--app-text)" }}
          >
            {label}
            {props.required && <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          style={{
            height: "38px",
            width: "100%",
            borderRadius: "8px",
            border: error ? "1.5px solid #ef4444" : "1.5px solid var(--border)",
            background: "var(--input-bg)",
            padding: "0 12px",
            fontSize: "14px",
            color: "var(--app-text)",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s ease",
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--brand-600)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,106,79,0.12)";
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "#ef4444" : "var(--border)";
            e.currentTarget.style.boxShadow = "none";
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>{error}</p>}
        {hint && !error && <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: 0 }}>{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
