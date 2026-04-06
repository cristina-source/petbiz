import { Skeleton, SkeletonCard, SkeletonRow } from "@/components/ui/skeleton";

export default function DefinicoesLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, height: "56px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", background: "var(--background)", padding: "0 16px 0 20px" }}>
        <Skeleton width="100px" height="16px" />
        <div style={{ flex: 1 }} />
      </header>
      <main style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Plano */}
        <SkeletonCard height="280px" />
        {/* Membros */}
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
            <Skeleton width="140px" height="16px" />
            <Skeleton width="100px" height="14px" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
        {/* Info */}
        <SkeletonCard height="180px" />
        {/* Export + Segurança */}
        <SkeletonCard height="120px" />
        <SkeletonCard height="140px" />
      </main>
    </div>
  );
}
