export function Skeleton({ width, height, radius = "8px", style }: {
  width?: string;
  height?: string;
  radius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="animate-pulse-soft"
      style={{
        width: width ?? "100%",
        height: height ?? "16px",
        borderRadius: radius,
        background: "var(--gray-100)",
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ height = "120px" }: { height?: string }) {
  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid var(--border)",
        background: "var(--card-bg)",
        padding: "24px",
        height,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <Skeleton width="40%" height="14px" />
      <Skeleton width="60%" height="24px" />
      <Skeleton width="30%" height="12px" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
      <Skeleton width="40px" height="40px" radius="10px" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <Skeleton width="140px" height="14px" />
        <Skeleton width="200px" height="12px" />
      </div>
      <Skeleton width="80px" height="12px" />
    </div>
  );
}
