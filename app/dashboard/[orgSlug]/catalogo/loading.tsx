import { Skeleton, SkeletonCard, SkeletonRow } from "@/components/ui/skeleton";

export default function CatalogoLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, height: "56px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", background: "var(--background)", padding: "0 16px 0 20px" }}>
        <Skeleton width="80px" height="16px" />
        <div style={{ flex: 1 }} />
        <Skeleton width="120px" height="36px" radius="8px" />
      </header>
      <main style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px" }}>
          <Skeleton width="100px" height="36px" radius="8px" />
          <Skeleton width="100px" height="36px" radius="8px" />
        </div>
        {/* Alert */}
        <SkeletonCard height="56px" />
        {/* Grid */}
        <div className="grid-3-cols" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} height="140px" />
          ))}
        </div>
      </main>
    </div>
  );
}
