import { Skeleton, SkeletonRow } from "@/components/ui/skeleton";

export default function AgendaLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, height: "56px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border)", background: "var(--background)", padding: "0 16px 0 20px" }}>
        <Skeleton width="70px" height="16px" />
        <div style={{ flex: 1 }} />
        <Skeleton width="130px" height="36px" radius="8px" />
      </header>
      <main style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Skeleton width="32px" height="32px" radius="8px" />
          <Skeleton width="220px" height="18px" />
          <Skeleton width="32px" height="32px" radius="8px" />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Skeleton width="60px" height="32px" radius="8px" />
          <Skeleton width="80px" height="32px" radius="8px" />
        </div>
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
