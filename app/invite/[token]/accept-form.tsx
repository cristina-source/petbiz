"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AcceptInviteFormProps {
  token: string;
  orgSlug: string;
  isLoggedIn: boolean;
  userEmail?: string;
  inviteEmail: string;
}

export function AcceptInviteForm({ token, orgSlug, isLoggedIn, userEmail, inviteEmail }: AcceptInviteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailMatch = userEmail?.toLowerCase() === inviteEmail.toLowerCase();

  async function handleAccept() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao aceitar convite.");
        return;
      }

      router.push(`/dashboard/${orgSlug}`);
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <p style={{ fontSize: "13px", color: "var(--app-text-muted)", textAlign: "center" }}>
          Precisas de iniciar sessão com <strong>{inviteEmail}</strong> para aceitar o convite.
        </p>
        <a
          href={`/login?callbackUrl=/invite/${token}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "42px", borderRadius: "8px",
            background: "var(--brand-600)", color: "white",
            fontSize: "14px", fontWeight: 600, textDecoration: "none",
          }}
        >
          Iniciar sessão
        </a>
      </div>
    );
  }

  if (!emailMatch) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            padding: "12px 16px", borderRadius: "8px",
            background: "#fef3c7", border: "1px solid #fde68a",
          }}
        >
          <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>
            Estás autenticado como <strong>{userEmail}</strong>, mas o convite foi enviado para <strong>{inviteEmail}</strong>.
          </p>
        </div>
        <a
          href={`/login?callbackUrl=/invite/${token}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "42px", borderRadius: "8px",
            background: "var(--brand-600)", color: "white",
            fontSize: "14px", fontWeight: 600, textDecoration: "none",
          }}
        >
          Entrar com outra conta
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {error && (
        <p style={{ fontSize: "13px", color: "#dc2626", textAlign: "center" }}>{error}</p>
      )}
      <Button
        onClick={handleAccept}
        loading={loading}
        style={{ width: "100%", height: "42px", fontSize: "14px" }}
      >
        Aceitar convite
      </Button>
      <a
        href="/dashboard"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "38px", borderRadius: "8px",
          fontSize: "13px", color: "var(--app-text-muted)", textDecoration: "none",
        }}
      >
        Recusar e voltar
      </a>
    </div>
  );
}
