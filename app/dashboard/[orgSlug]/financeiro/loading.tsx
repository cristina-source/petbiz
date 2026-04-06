import { Skeleton, SkeletonCard, SkeletonRow } from "@/components/ui/skeleton";

export default function FinanceiroLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, height: "56px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", background: "var(--background)", padding: "0 16px 0 20px" }}>
        <Skeleton width="90px" height="16px" />
        <div style={{ flex: 1 }} />
        <Skeleton width="140px" height="36px" radius="8px" />
      </header>
      <main style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="grid-4-cols" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard height="80px" />
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
