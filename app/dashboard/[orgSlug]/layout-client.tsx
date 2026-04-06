"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/contexts/toast-context";
import { CommandPalette } from "@/components/ui/command-palette";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  orgSlug: string;
  orgName: string;
  plan: string;
  userName?: string;
}

export function DashboardLayoutClient({
  children,
  orgSlug,
  orgName,
  plan,
  userName,
}: DashboardLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // [ITERATE v3] — Mobile hamburger: escuta evento global do Topbar
  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("open-mobile-menu", handler);
    return () => window.removeEventListener("open-mobile-menu", handler);
  }, []);

  return (
    <ToastProvider>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--background-subtle)",
        }}
      >
        <Sidebar
          orgSlug={orgSlug}
          orgName={orgName}
          plan={plan}
          userName={userName}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            minHeight: "100vh",
          }}
        >
          {children}
        </div>
      </div>
      <CommandPalette orgSlug={orgSlug} />
    </ToastProvider>
  );
}
