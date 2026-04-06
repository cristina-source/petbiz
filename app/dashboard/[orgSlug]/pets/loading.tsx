import { Skeleton, SkeletonRow } from "@/components/ui/skeleton";

export default function PetsLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, height: "56px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", background: "var(--background)", padding: "0 16px 0 20px" }}>
        <Skeleton width="60px" height="16px" />
        <div style={{ flex: 1 }} />
        <Skeleton width="100px" height="36px" radius="8px" />
      </header>
      <main style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Skeleton width="440px" height="40px" radius="10px" style={{ maxWidth: "100%" }} />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="80px" height="28px" radius="100px" />
          ))}
        </div>
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
