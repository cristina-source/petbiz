"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, UserPlus } from "lucide-react";

const ROLES = [
  { value: "ADMIN", label: "Admin", desc: "Acesso total, incluindo definições e membros" },
  { value: "MANAGER", label: "Manager", desc: "Gerir clientes, agenda e financeiro" },
  { value: "COLLABORATOR", label: "Colaborador", desc: "Acesso à agenda e clientes atribuídos" },
  { value: "VET", label: "Veterinário", desc: "Consultas, fichas clínicas e vacinas" },
];

export default function ConvidarMembroPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("COLLABORATOR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Introduz um email válido.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/orgs/${orgSlug}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar convite.");
        return;
      }

      setSuccess(true);
      setEmail("");
      setRole("COLLABORATOR");
      setTimeout(() => router.push(`/dashboard/${orgSlug}/definicoes`), 2000);
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  }

  const base = `/dashboard/${orgSlug}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Convidar membro" orgSlug={orgSlug} />

      <main style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "560px" }}>
        <Breadcrumbs
          items={[
            { label: "Definições", href: `${base}/definicoes` },
            { label: "Convidar membro" },
          ]}
        />

        <form onSubmit={handleSubmit}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "var(--brand-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserPlus size={18} style={{ color: "var(--brand-600)" }} />
              </div>
              <div>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>
                  Convidar novo membro
                </p>
                <p style={{ fontSize: "13px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                  O convite é válido por 7 dias
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); setSuccess(false); }}
                placeholder="nome@exemplo.pt"
                required
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--app-text)" }}>
                  Papel <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: role === r.value ? "2px solid var(--brand-500)" : "2px solid var(--border)",
                        background: role === r.value ? "var(--brand-50)" : "transparent",
                        cursor: "pointer",
                        transition: "border-color 0.15s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={role === r.value}
                        onChange={() => setRole(r.value)}
                        style={{ marginTop: "2px", accentColor: "var(--brand-600)" }}
                      />
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>
                          {r.label}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                          {r.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: "13px", color: "#dc2626", marginTop: "16px" }}>{error}</p>
            )}

            {success && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Mail size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                <p style={{ fontSize: "13px", color: "#166534", margin: 0 }}>
                  Convite criado com sucesso! O membro poderá aceitar através do link de convite.
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <Button type="submit" loading={saving}>
                <UserPlus size={14} />
                Enviar convite
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`${base}/definicoes`)}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </form>
      </main>
    </div>
  );
}
