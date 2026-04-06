"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";

const SERVICE_COLORS = [
  { label: "Verde", value: "#16a34a" },
  { label: "Azul", value: "#2563eb" },
  { label: "Roxo", value: "#7c3aed" },
  { label: "Laranja", value: "#ea580c" },
  { label: "Rosa", value: "#db2777" },
  { label: "Ciano", value: "#0891b2" },
];

export default function NovoServicoPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    duration: "60",
    price: "",
    color: "#16a34a",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.duration) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/servicos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push(`/dashboard/${orgSlug}/catalogo?tab=services`);
    } catch {
      setError("Erro ao criar serviço. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Novo serviço" orgSlug={orgSlug} />
      <main style={{ flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: "Catálogo", href: `/dashboard/${orgSlug}/catalogo?tab=services` },
            { label: "Novo serviço" },
          ]} />
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", marginBottom: "16px" }}>Informações do serviço</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Input label="Nome *" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Banho & Secagem" required />
              </div>
              <Input label="Categoria" value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Ex: Higiene" />
              <Input label="Duração (min) *" type="number" min="5" step="5" value={form.duration} onChange={(e) => update("duration", e.target.value)} required />
              <div style={{ gridColumn: "1 / -1" }}>
                <Input label="Preço (€) *" type="number" step="0.01" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" required />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Textarea label="Descrição" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Descrição opcional..." rows={2} />
              </div>
            </div>
          </Card>

          <Card>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", marginBottom: "12px" }}>Cor na agenda</p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {SERVICE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => update("color", c.value)}
                  title={c.label}
                  style={{
                    width: "32px", height: "32px", borderRadius: "50%", border: form.color === c.value ? "3px solid var(--app-text)" : "3px solid transparent",
                    background: c.value, cursor: "pointer", outline: "none",
                  }}
                />
              ))}
            </div>
          </Card>

          {error && <p style={{ fontSize: "14px", color: "#dc2626" }}>{error}</p>}

          <div style={{ display: "flex", gap: "12px" }}>
            <Button type="submit" loading={loading} disabled={!form.name || !form.price || !form.duration}>
              <Save size={15} />
              Guardar serviço
            </Button>
            <Link href={`/dashboard/${orgSlug}/catalogo?tab=services`}>
              <Button type="button" variant="secondary">Cancelar</Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
