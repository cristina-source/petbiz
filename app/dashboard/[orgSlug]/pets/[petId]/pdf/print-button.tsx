"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        height: "36px", padding: "0 16px", borderRadius: "8px",
        background: "var(--brand-600)", color: "white", border: "none",
        fontSize: "13px", fontWeight: 600, cursor: "pointer",
      }}
    >
      <Printer size={14} /> Imprimir / Guardar PDF
    </button>
  );
}
