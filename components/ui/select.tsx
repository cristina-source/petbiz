import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, id, style, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{ fontSize: "13px", fontWeight: 500, color: "var(--app-text)" }}
          >
            {label}
            {props.required && <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
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
            cursor: "pointer",
            appearance: "auto",
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
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p style={{ fontSize: "12px", color: "#dc2626", margin: 0 }}>{error}</p>}
        {hint && !error && <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: 0 }}>{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export { Select };
