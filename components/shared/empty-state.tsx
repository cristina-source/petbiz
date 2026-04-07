import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
      {Icon && (
        <div style={{ marginBottom: "16px", width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--brand-50)" }}>
          <Icon size={28} style={{ color: "var(--brand-500)" }} />
        </div>
      )}
      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: "0 0 6px" }}>
        {title}
      </h3>
      <p style={{ fontSize: "13px", color: "var(--app-text-muted)", maxWidth: "280px", margin: "0 0 24px", lineHeight: 1.5 }}>
        {description}
      </p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: "38px", padding: "0 16px", borderRadius: "8px",
              background: "var(--brand-600)", color: "white",
              fontSize: "14px", fontWeight: 600, textDecoration: "none",
            }}
          >
            {action.label}
          </Link>
        ) : (
          <Button onClick={action.onClick} size="md">
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
