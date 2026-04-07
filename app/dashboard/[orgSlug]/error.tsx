"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <AlertCircle size={26} style={{ color: "#dc2626" }} />
      </div>
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "var(--app-text)",
          margin: "0 0 8px",
        }}
      >
        Algo correu mal
      </h2>
      <p
        style={{
          fontSize: "14px",
          color: "var(--app-text-muted)",
          maxWidth: "360px",
          margin: "0 0 24px",
          lineHeight: 1.6,
        }}
      >
        Ocorreu um erro ao carregar esta página. Tenta novamente ou contacta o suporte se o problema persistir.
      </p>
      <button
        onClick={reset}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          height: "38px",
          padding: "0 18px",
          borderRadius: "8px",
          background: "var(--brand-600)",
          color: "white",
          fontSize: "14px",
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
        }}
      >
        <RefreshCw size={14} /> Tentar novamente
      </button>
      {error.digest && (
        <p
          style={{
            marginTop: "16px",
            fontSize: "11px",
            color: "var(--app-text-subtle)",
            fontFamily: "monospace",
          }}
        >
          ID: {error.digest}
        </p>
      )}
    </div>
  );
}
