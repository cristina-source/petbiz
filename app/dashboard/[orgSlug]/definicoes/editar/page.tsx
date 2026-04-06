"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OrgData {
  businessName: string;
  name: string;
  city: string;
  phone: string;
  address: string;
}

export default function EditarDefinicoesPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<OrgData>({
    businessName: "",
    name: "",
    city: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchOrgData();
  }, [orgSlug]);

  async function fetchOrgData() {
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/settings`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          businessName: data.businessName ?? "",
          name: data.name ?? "",
          city: data.city ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function update(field: keyof OrgData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.businessName.trim()) {
      setError("O nome do negócio é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/orgs/${orgSlug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao guardar.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/${orgSlug}/definicoes`), 1200);
    } catch {
      setError("Erro de ligação. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  }

  const base = `/dashboard/${orgSlug}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Editar informações" orgSlug={orgSlug} />

      <main style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "640px" }}>
        <Breadcrumbs
          items={[
            { label: "Definições", href: `${base}/definicoes` },
            { label: "Editar informações" },
          ]}
        />

        {loading ? (
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ height: "38px", borderRadius: "8px", background: "var(--gray-100)" }} />
              ))}
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: "0 0 20px" }}>
                Informações do negócio
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Input
                  label="Nome do negócio"
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  placeholder="Ex: PetShop da Maria"
                  required
                />

                <Input
                  label="Nome da organização"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Nome interno"
                  hint="Nome usado internamente no sistema"
                />

                <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Input
                    label="Cidade"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="Ex: Lisboa"
                  />
                  <Input
                    label="Telefone"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="Ex: +351 912 345 678"
                    type="tel"
                  />
                </div>

                <Input
                  label="Morada"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Rua, número, código postal"
                />
              </div>

              {error && (
                <p style={{ fontSize: "13px", color: "#dc2626", marginTop: "16px" }}>{error}</p>
              )}

              {success && (
                <p style={{ fontSize: "13px", color: "var(--brand-600)", marginTop: "16px", fontWeight: 500 }}>
                  Informações guardadas com sucesso!
                </p>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <Button type="submit" loading={saving}>
                  Guardar alterações
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
        )}
      </main>
    </div>
  );
}
