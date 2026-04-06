"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

const STATUS_PT: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em curso",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  PENDING:     { bg: "#fef9c3", color: "#92400e", border: "#fde68a" },
  CONFIRMED:   { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
  COMPLETED:   { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  CANCELLED:   { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
  NO_SHOW:     { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
};

const STATUS_FLOW: Record<string, string[]> = {
  PENDING:     ["CONFIRMED", "CANCELLED"],
  CONFIRMED:   ["IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED:   [],
  CANCELLED:   ["PENDING"],
  NO_SHOW:     ["PENDING"],
};

interface Props {
  appointmentId: string;
  orgSlug: string;
  currentStatus: string;
}

export function AppointmentStatusActions({ appointmentId, orgSlug, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
  const nextStatuses = STATUS_FLOW[status] ?? [];

  async function updateStatus(newStatus: string) {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (nextStatuses.length === 0) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 10px",
          borderRadius: "100px",
          fontSize: "11px",
          fontWeight: 600,
          background: colors.bg,
          color: colors.color,
          border: `1px solid ${colors.border}`,
          whiteSpace: "nowrap",
        }}
      >
        {status === "COMPLETED" && <Check size={10} />}
        {STATUS_PT[status] ?? status}
      </span>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px 3px 10px",
          borderRadius: "100px",
          fontSize: "11px",
          fontWeight: 600,
          background: colors.bg,
          color: colors.color,
          border: `1px solid ${colors.border}`,
          cursor: "pointer",
          whiteSpace: "nowrap",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {STATUS_PT[status] ?? status}
        <ChevronDown size={10} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 4px)",
              zIndex: 50,
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              minWidth: "160px",
              overflow: "hidden",
            }}
          >
            {nextStatuses.map((s) => {
              const c = STATUS_COLORS[s];
              return (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--app-text)",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-100)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: c?.color ?? "currentColor",
                      flexShrink: 0,
                    }}
                  />
                  {STATUS_PT[s] ?? s}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
