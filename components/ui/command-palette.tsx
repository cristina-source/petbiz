"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Users, CalendarDays, DollarSign,
  ShoppingBag, BookOpen, Settings, Plus, PawPrint, X, Download,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
}

interface CommandPaletteProps {
  orgSlug: string;
}

export function CommandPalette({ orgSlug }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const base = `/dashboard/${orgSlug}`;

  const items: CommandItem[] = [
    // Navegação
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} />, action: () => router.push(base), group: "Navegar" },
    { id: "clientes", label: "Clientes", icon: <Users size={15} />, action: () => router.push(`${base}/clientes`), group: "Navegar" },
    { id: "agenda", label: "Agenda", icon: <CalendarDays size={15} />, action: () => router.push(`${base}/agenda`), group: "Navegar" },
    { id: "financeiro", label: "Financeiro", icon: <DollarSign size={15} />, action: () => router.push(`${base}/financeiro`), group: "Navegar" },
    { id: "catalogo", label: "Catálogo", icon: <ShoppingBag size={15} />, action: () => router.push(`${base}/catalogo`), group: "Navegar" },
    { id: "recursos", label: "Recursos", icon: <BookOpen size={15} />, action: () => router.push(`${base}/recursos`), group: "Navegar" },
    { id: "definicoes", label: "Definições", icon: <Settings size={15} />, action: () => router.push(`${base}/definicoes`), group: "Navegar" },
    // Acções
    { id: "novo-cliente", label: "Novo cliente", description: "Adicionar cliente", icon: <Plus size={15} />, action: () => router.push(`${base}/clientes/novo`), group: "Criar" },
    { id: "nova-marcacao", label: "Nova marcação", description: "Agendar consulta", icon: <Plus size={15} />, action: () => router.push(`${base}/agenda/novo`), group: "Criar" },
    { id: "novo-pet", label: "Novo pet", description: "Registar animal", icon: <PawPrint size={15} />, action: () => router.push(`${base}/pets/novo`), group: "Criar" },
    { id: "nova-transaccao", label: "Nova transacção", description: "Registar receita ou despesa", icon: <Plus size={15} />, action: () => router.push(`${base}/financeiro/nova`), group: "Criar" },
    // Exportar
    { id: "export-clientes", label: "Exportar clientes", description: "Descarregar CSV", icon: <Download size={15} />, action: () => { window.location.href = `/api/orgs/${orgSlug}/clientes/export`; }, group: "Exportar" },
    { id: "export-financeiro", label: "Exportar financeiro", description: "Descarregar CSV", icon: <Download size={15} />, action: () => { window.location.href = `/api/orgs/${orgSlug}/transactions/export`; }, group: "Exportar" },
  ];

  const filtered = query
    ? items.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.description?.toLowerCase().includes(query.toLowerCase()) ||
        i.group.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelected(0);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, flatFiltered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      }
      if (e.key === "Enter" && flatFiltered[selected]) {
        flatFiltered[selected].action();
        close();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, selected, flatFiltered, close]);

  useEffect(() => setSelected(0), [query]);

  if (!open) return null;

  let itemIndex = 0;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "120px",
      }}
      onClick={close}
    >
      <div
        style={{
          width: "100%", maxWidth: "560px", borderRadius: "16px",
          background: "var(--background)", border: "1px solid var(--border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Search size={16} style={{ color: "var(--app-text-muted)", flexShrink: 0 }} />
          <input
            autoFocus
            placeholder="Pesquisar ou navegar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, fontSize: "15px", color: "var(--app-text)",
              background: "transparent", border: "none", outline: "none",
            }}
          />
          <button onClick={close} style={{ color: "var(--app-text-muted)", cursor: "pointer", background: "none", border: "none", padding: "2px" }}>
            <X size={15} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "360px", overflowY: "auto", padding: "6px" }}>
          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group}>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--app-text-muted)", padding: "8px 10px 4px" }}>
                {group}
              </p>
              {groupItems.map((item) => {
                const idx = itemIndex++;
                const isSelected = idx === selected;
                return (
                  <button
                    key={item.id}
                    onClick={() => { item.action(); close(); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 12px", borderRadius: "8px", textAlign: "left",
                      background: isSelected ? "var(--brand-50)" : "transparent",
                      border: "none", cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={() => setSelected(idx)}
                  >
                    <span style={{ color: isSelected ? "var(--brand-600)" : "var(--app-text-muted)", flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)" }}>{item.label}</p>
                      {item.description && (
                        <p style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>{item.description}</p>
                      )}
                    </div>
                    {isSelected && (
                      <kbd style={{ fontSize: "11px", color: "var(--app-text-muted)", background: "var(--gray-100)", border: "1px solid var(--border)", borderRadius: "4px", padding: "2px 6px" }}>
                        ↵
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {flatFiltered.length === 0 && (
            <p style={{ textAlign: "center", fontSize: "14px", color: "var(--app-text-muted)", padding: "24px" }}>
              Sem resultados para &quot;{query}&quot;
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "8px 16px", display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "11px", color: "var(--app-text-muted)" }}>
            <kbd style={{ background: "var(--gray-100)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1px 5px", fontSize: "11px" }}>↑↓</kbd> navegar
          </span>
          <span style={{ fontSize: "11px", color: "var(--app-text-muted)" }}>
            <kbd style={{ background: "var(--gray-100)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1px 5px", fontSize: "11px" }}>↵</kbd> seleccionar
          </span>
          <span style={{ fontSize: "11px", color: "var(--app-text-muted)" }}>
            <kbd style={{ background: "var(--gray-100)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1px 5px", fontSize: "11px" }}>Esc</kbd> fechar
          </span>
        </div>
      </div>
    </div>
  );
}
