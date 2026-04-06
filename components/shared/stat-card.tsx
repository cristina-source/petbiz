// [ITERATE v2] — Convertido de Tailwind para inline styles
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "var(--brand-600)",
}: StatCardProps) {
  const changeColor =
    changeType === "up" ? "#059669" : changeType === "down" ? "#ef4444" : "var(--app-text-muted)";

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "13px", color: "var(--app-text-muted)", fontWeight: 500, margin: 0 }}>
            {title}
          </p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--app-text)", margin: "4px 0 0" }}>
            {value}
          </p>
          {change && (
            <p style={{ fontSize: "12px", marginTop: "6px", fontWeight: 500, color: changeColor }}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div
            style={{
              display: "flex",
              height: "40px",
              width: "40px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
              background: `${iconColor}18`,
              flexShrink: 0,
            }}
          >
            <Icon size={20} style={{ color: iconColor }} />
          </div>
        )}
      </div>
    </Card>
  );
}
