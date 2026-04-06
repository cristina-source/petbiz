import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", flexWrap: "wrap" }}>
      {items.map((crumb, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            {idx > 0 && <ChevronRight size={13} style={{ color: "var(--app-text-muted)", flexShrink: 0, opacity: 0.5 }} />}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                style={{ color: "var(--app-text-muted)", textDecoration: "none", fontWeight: 500 }}
                className="client-row"
              >
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: isLast ? "var(--app-text)" : "var(--app-text-muted)", fontWeight: isLast ? 600 : 500 }}>
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
