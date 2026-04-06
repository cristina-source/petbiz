import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, rows = 3, style, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {label && (
          <label
            htmlFor={textareaId}
            style={{ fontSize: "13px", fontWeight: 500, color: "var(--app-text)" }}
          >
            {label}
            {props.required && <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          style={{
            width: "100%",
            borderRadius: "8px",
            border: error ? "1.5px solid #ef4444" : "1.5px solid var(--border)",
            background: "var(--input-bg)",
            padding: "10px 12px",
            fontSize: "14px",
            color: "var(--app-text)",
            outline: "none",
            resize: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            lineHeight: "1.5",
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

Textarea.displayName = "Textarea";
export { Textarea };
