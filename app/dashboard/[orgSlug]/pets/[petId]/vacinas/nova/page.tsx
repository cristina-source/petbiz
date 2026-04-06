"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Syringe } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";

export default function NovaVacinaPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const petId = params.petId as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    date: "",
    nextDueDate: "",
    lotNumber: "",
    notes: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.date) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/pets/${petId}/vacinas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push(`/dashboard/${orgSlug}/pets/${petId}`);
    } catch {
      setError("Erro ao registar vacina. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Registar vacina" orgSlug={orgSlug} />
      <main style={{ flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: "Pets", href: `/dashboard/${orgSlug}/pets` },
            { label: "Ficha", href: `/dashboard/${orgSlug}/pets/${petId}` },
            { label: "Nova vacina" },
          ]} />
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: "520px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--brand-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Syringe size={18} style={{ color: "var(--brand-600)" }} />
              </div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)" }}>Detalhes da vacina</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                label="Nome da vacina *"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Ex: Raiva, Parvovírus, Leptospirose..."
                required
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Input
                  label="Data de administração *"
                  type="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  required
                />
                <Input
                  label="Próximo reforço"
                  type="date"
                  value={form.nextDueDate}
                  onChange={(e) => update("nextDueDate", e.target.value)}
                />
              </div>

              <Input
                label="Número de lote"
                value={form.lotNumber}
                onChange={(e) => update("lotNumber", e.target.value)}
                placeholder="Ex: RV2024-012"
              />

              <Textarea
                label="Notas"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </Card>

          {error && <p style={{ fontSize: "14px", color: "#dc2626" }}>{error}</p>}

          <div style={{ display: "flex", gap: "12px" }}>
            <Button type="submit" loading={loading} disabled={!form.name || !form.date}>
              <Save size={15} />
              Registar vacina
            </Button>
            <Link href={`/dashboard/${orgSlug}/pets/${petId}`}>
              <Button type="button" variant="secondary">Cancelar</Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
