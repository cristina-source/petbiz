import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function RecursosLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, height: "56px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", background: "var(--background)", padding: "0 16px 0 20px" }}>
        <Skeleton width="80px" height="16px" />
        <div style={{ flex: 1 }} />
      </header>
      <main style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="80px" height="28px" radius="100px" />
          ))}
        </div>
        <div className="grid-3-cols" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} height="160px" />
          ))}
        </div>
      </main>
    </div>
  );
}
