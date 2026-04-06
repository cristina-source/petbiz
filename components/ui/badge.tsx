// [ITERATE v1] — Convertido de Tailwind para inline styles (Tailwind v4: CSS variable arbitrary values não aplicam)

const VARIANT_STYLES: Record<string, { background: string; color: string }> = {
  default:  { background: "var(--gray-100)", color: "var(--app-text)" },
  brand:    { background: "var(--brand-100)", color: "var(--brand-800)" },
  success:  { background: "#d1fae5", color: "#065f46" },
  warning:  { background: "#fef3c7", color: "#92400e" },
  danger:   { background: "#fee2e2", color: "#991b1b" },
  info:     { background: "#dbeafe", color: "#1e40af" },
  purple:   { background: "#ede9fe", color: "#5b21b6" },
};

const STATUS_MAP: Record<string, keyof typeof VARIANT_STYLES> = {
  PENDING:    "warning",
  CONFIRMED:  "info",
  IN_PROGRESS: "purple",
  COMPLETED:  "success",
  CANCELLED:  "danger",
  NO_SHOW:    "danger",
  PAID:       "success",
  OVERDUE:    "danger",
  REFUNDED:   "info",
  FREE:       "default",
  STARTER:    "brand",
  PRO:        "brand",
  TEAM:       "brand",
  ACTIVE:     "success",
  CANCELED:   "danger",
  PAST_DUE:   "danger",
  TRIALING:   "info",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof VARIANT_STYLES;
  status?: string;
  className?: string;
}

export function Badge({ children, variant = "default", status }: BadgeProps) {
  const key = status ? (STATUS_MAP[status] ?? "default") : variant;
  const { background, color } = VARIANT_STYLES[key] ?? VARIANT_STYLES.default;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        borderRadius: "9999px",
        padding: "2px 10px",
        fontSize: "12px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        background,
        color,
      }}
    >
      {children}
    </span>
  );
}
