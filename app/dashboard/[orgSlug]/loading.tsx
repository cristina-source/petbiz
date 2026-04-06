import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, height: "56px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", background: "var(--background)", padding: "0 16px 0 20px" }}>
        <Skeleton width="120px" height="16px" />
        <div style={{ flex: 1 }} />
        <Skeleton width="100px" height="32px" radius="8px" />
      </header>
      <main style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="grid-4-cols" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <SkeletonCard height="300px" />
          <SkeletonCard height="300px" />
        </div>
      </main>
    </div>
  );
}
