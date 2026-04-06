"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PawPrint,
  LayoutDashboard,
  Users,
  CalendarDays,
  DollarSign,
  ShoppingBag,
  BookOpen,
  Settings,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  section?: string;
}

function getNavItems(orgSlug: string): NavItem[] {
  const base = `/dashboard/${orgSlug}`;
  return [
    { href: base, label: "Dashboard", icon: LayoutDashboard, section: "main" },
    { href: `${base}/agenda`, label: "Agenda", icon: CalendarDays, section: "main" },
    { href: `${base}/clientes`, label: "Clientes", icon: Users, section: "main" },
    { href: `${base}/pets`, label: "Pets", icon: PawPrint, section: "main" },
    { href: `${base}/financeiro`, label: "Financeiro", icon: DollarSign, section: "main" },
    { href: `${base}/catalogo`, label: "Catálogo", icon: ShoppingBag, section: "config" },
    { href: `${base}/recursos`, label: "Recursos", icon: BookOpen, section: "config" },
    { href: `${base}/definicoes`, label: "Definições", icon: Settings, section: "config" },
  ];
}

interface SidebarProps {
  orgSlug: string;
  orgName: string;
  plan: string;
  userName?: string;
  userImage?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// [ITERATE v3] — Sidebar usa var(--sidebar-bg) em vez de cor verde hardcoded
const SIDEBAR_BG = "var(--sidebar-bg)";
const SIDEBAR_WIDTH = 220;

export function Sidebar({
  orgSlug,
  orgName,
  plan,
  userName,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(orgSlug);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  function isActive(href: string) {
    if (href === `/dashboard/${orgSlug}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  const mainItems = navItems.filter((i) => i.section === "main");
  const configItems = navItems.filter((i) => i.section === "config");

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: SIDEBAR_BG,
        width: `${SIDEBAR_WIDTH}px`,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PawPrint size={16} color="white" />
          </div>
          <span
            style={{
              fontWeight: 700,
              color: "#ffffff",
              fontSize: "16px",
              letterSpacing: "-0.01em",
            }}
          >
            PetBiz
          </span>
        </div>
        {mobileOpen && onMobileClose && (
          <button
            onClick={onMobileClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Org block */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: "3px",
          }}
        >
          Negócio
        </p>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#ffffff",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "4px",
          }}
        >
          {orgName}
        </p>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: "100px",
            background: "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.65)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {plan}
        </span>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Main section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <p
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.35)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "0 6px",
              marginBottom: "4px",
            }}
          >
            Principal
          </p>
          {mainItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const hovered = hoveredHref === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                onMouseEnter={() => setHoveredHref(href)}
                onMouseLeave={() => setHoveredHref(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 500,
                  color: active ? "#ffffff" : "rgba(255,255,255,0.65)",
                  background: active
                    ? "rgba(255,255,255,0.14)"
                    : hovered
                    ? "rgba(255,255,255,0.07)"
                    : "transparent",
                  transition: "background 0.12s ease, color 0.12s ease",
                  position: "relative",
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: "-10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: "18px",
                      borderRadius: "0 3px 3px 0",
                      background: "rgba(255,255,255,0.7)",
                    }}
                  />
                )}
                <Icon
                  size={16}
                  style={{
                    color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
                    flexShrink: 0,
                  }}
                />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Config section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <p
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.35)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "0 6px",
              marginBottom: "4px",
            }}
          >
            Configuração
          </p>
          {configItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const hovered = hoveredHref === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                onMouseEnter={() => setHoveredHref(href)}
                onMouseLeave={() => setHoveredHref(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 500,
                  color: active ? "#ffffff" : "rgba(255,255,255,0.65)",
                  background: active
                    ? "rgba(255,255,255,0.14)"
                    : hovered
                    ? "rgba(255,255,255,0.07)"
                    : "transparent",
                  transition: "background 0.12s ease, color 0.12s ease",
                  position: "relative",
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: "-10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: "18px",
                      borderRadius: "0 3px 3px 0",
                      background: "rgba(255,255,255,0.7)",
                    }}
                  />
                )}
                <Icon
                  size={16}
                  style={{
                    color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
                    flexShrink: 0,
                  }}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User footer */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "10px",
        }}
      >
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 10px",
            borderRadius: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.65)",
            transition: "background 0.12s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {userName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span
            style={{
              flex: 1,
              textAlign: "left",
              fontSize: "13px",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            {userName ?? "Utilizador"}
          </span>
          <ChevronDown
            size={13}
            style={{
              color: "rgba(255,255,255,0.4)",
              transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
              flexShrink: 0,
            }}
          />
        </button>

        {userMenuOpen && (
          <div
            style={{
              marginTop: "4px",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.65)",
                fontSize: "13px",
                fontWeight: 500,
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.65)";
              }}
            >
              <LogOut size={14} />
              Sair da conta
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          flexShrink: 0,
          height: "100vh",
          position: "sticky",
          top: 0,
          display: "flex",
          flexDirection: "column",
        }}
        className="hidden-mobile"
      >
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
            }}
            onClick={onMobileClose}
          />
          <aside
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${SIDEBAR_WIDTH}px`,
              zIndex: 50,
              animation: "slideIn 0.25s ease-out",
            }}
          >
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
