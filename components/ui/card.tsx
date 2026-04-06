"use client";

const PADDING = { none: "0px", sm: "16px", md: "24px", lg: "32px" };

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  style?: React.CSSProperties;
}

export function Card({ children, className, hover, padding = "md", style }: CardProps) {
  return (
    <div
      className={className}
      style={{
        borderRadius: "12px",
        border: "1px solid var(--border)",
        background: "var(--card-bg)",
        boxShadow: "var(--card-shadow)",
        padding: PADDING[padding],
        transition: hover ? "box-shadow 0.15s ease, transform 0.15s ease" : undefined,
        cursor: hover ? "pointer" : undefined,
        ...style,
      }}
      onMouseEnter={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--card-shadow-hover)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--card-shadow)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>
      {children}
    </h3>
  );
}
