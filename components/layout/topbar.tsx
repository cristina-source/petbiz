"use client";

import { Menu, Plus, CalendarDays, Users, PawPrint, Search, Bell } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

interface TopbarProps {
  title?: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
  orgSlug?: string;
}

export function Topbar({ title, onMenuClick, actions, orgSlug }: TopbarProps) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alerts, setAlerts] = useState<{ overdueVaccines: number; pendingAppointments: number; todayAppointments: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setQuickOpen(false);
      }
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setAlertOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!orgSlug) return;
    fetch(`/api/orgs/${orgSlug}/alerts`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setAlertCount(data.total);
          setAlerts(data);
        }
      })
      .catch(() => {});
  }, [orgSlug]);

  const base = orgSlug ? `/dashboard/${orgSlug}` : "#";

  const quickActions = [
    { label: "Nova marcação", icon: CalendarDays, href: `${base}/agenda/novo` },
    { label: "Novo cliente", icon: Users, href: `${base}/clientes/novo` },
    { label: "Novo pet", icon: PawPrint, href: `${base}/pets/novo` },
  ];

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 30,
        height: "56px", display: "flex", alignItems: "center", gap: "12px",
        borderBottom: "1px solid var(--border)", background: "var(--background)",
        padding: "0 16px 0 20px",
      }}
    >
      {/* Mobile menu — hidden on desktop, visible on mobile via CSS */}
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent("open-mobile-menu"));
          onMenuClick?.();
        }}
        style={{ padding: "6px", borderRadius: "8px", color: "var(--app-text-muted)", background: "none", border: "none", cursor: "pointer" }}
        className="mobile-menu-btn"
      >
        <Menu size={20} />
      </button>

      {/* Title */}
      {title && (
        <h1 style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </h1>
      )}
      {!title && <div style={{ flex: 1 }} />}

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>

        {/* ⌘K hint */}
        <button
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
            document.dispatchEvent(e);
          }}
          style={{
            display: "flex", alignItems: "center", gap: "6px", height: "32px", padding: "0 10px",
            borderRadius: "8px", border: "1px solid var(--border)", background: "var(--gray-50)",
            color: "var(--app-text-muted)", fontSize: "12px", cursor: "pointer",
          }}
          title="Pesquisar (⌘K)"
        >
          <Search size={12} />
          <span className="hide-mobile">Pesquisar</span>
          <kbd className="hide-mobile" style={{ fontSize: "10px", background: "var(--gray-200)", borderRadius: "4px", padding: "1px 4px", fontFamily: "monospace" }}>⌘K</kbd>
        </button>

        {/* Notification bell */}
        {orgSlug && (
          <div ref={alertRef} style={{ position: "relative" }}>
            <button
              onClick={() => setAlertOpen((v) => !v)}
              style={{
                position: "relative", width: "32px", height: "32px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--gray-50)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--app-text-muted)",
              }}
              title="Alertas"
            >
              <Bell size={15} />
              {alertCount > 0 && (
                <span style={{
                  position: "absolute", top: "-4px", right: "-4px",
                  minWidth: "16px", height: "16px", borderRadius: "100px",
                  background: "#ef4444", color: "white", fontSize: "10px",
                  fontWeight: 700, display: "flex", alignItems: "center",
                  justifyContent: "center", padding: "0 4px",
                  border: "2px solid var(--background)",
                }}>
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </button>

            {alertOpen && alerts && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "var(--background)", border: "1px solid var(--border)",
                borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                minWidth: "240px", padding: "12px", zIndex: 50,
              }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--app-text)", marginBottom: "10px" }}>Alertas</p>
                {alertCount === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--app-text-muted)" }}>Sem alertas pendentes</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {alerts.overdueVaccines > 0 && (
                      <Link
                        href={`/dashboard/${orgSlug}/pets`}
                        onClick={() => setAlertOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", borderRadius: "8px", textDecoration: "none", background: "#fef2f2", border: "1px solid #fecaca" }}
                      >
                        <span style={{ fontSize: "14px" }}>💉</span>
                        <div>
                          <p style={{ fontSize: "12px", fontWeight: 600, color: "#991b1b", margin: 0 }}>{alerts.overdueVaccines} vacina{alerts.overdueVaccines !== 1 ? "s" : ""} em atraso</p>
                        </div>
                      </Link>
                    )}
                    {alerts.pendingAppointments > 0 && (
                      <Link
                        href={`/dashboard/${orgSlug}/agenda`}
                        onClick={() => setAlertOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", borderRadius: "8px", textDecoration: "none", background: "#fffbeb", border: "1px solid #fde68a" }}
                      >
                        <span style={{ fontSize: "14px" }}>⏰</span>
                        <div>
                          <p style={{ fontSize: "12px", fontWeight: 600, color: "#92400e", margin: 0 }}>{alerts.pendingAppointments} marcaç{alerts.pendingAppointments !== 1 ? "ões" : "ão"} por confirmar</p>
                        </div>
                      </Link>
                    )}
                  </div>
                )}
                {alerts.todayAppointments > 0 && (
                  <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: 0 }}>
                      📅 {alerts.todayAppointments} marcaç{alerts.todayAppointments !== 1 ? "ões" : "ão"} hoje
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions passed in (e.g. "Novo cliente" button) */}
        {actions}

        {/* Quick "+" button with dropdown */}
        {orgSlug && (
          <div ref={ref} style={{ position: "relative" }}>
            <button
              onClick={() => setQuickOpen((v) => !v)}
              style={{
                width: "32px", height: "32px", borderRadius: "8px",
                background: "var(--brand-600)", color: "white", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
              title="Acções rápidas"
            >
              <Plus size={17} />
            </button>

            {quickOpen && (
              <div
                style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: "var(--background)", border: "1px solid var(--border)",
                  borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  minWidth: "180px", padding: "6px", zIndex: 50,
                }}
              >
                {quickActions.map(({ label, icon: Icon, href }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setQuickOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "9px 12px", borderRadius: "8px", textDecoration: "none",
                      color: "var(--app-text)", fontSize: "14px", fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-50)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Icon size={15} style={{ color: "var(--brand-600)" }} />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
