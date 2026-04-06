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

export default function NovoProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    sku: "",
    price: "",
    costPrice: "",
    stock: "0",
    minStock: "5",
    unit: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/produtos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push(`/dashboard/${orgSlug}/catalogo`);
    } catch {
      setError("Erro ao criar produto. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Novo produto" orgSlug={orgSlug} />
      <main style={{ flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: "Catálogo", href: `/dashboard/${orgSlug}/catalogo` },
            { label: "Novo produto" },
          ]} />
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", marginBottom: "16px" }}>Informações do produto</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Input label="Nome *" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Champô Premium" required />
              </div>
              <Input label="Categoria" value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Ex: Higiene" />
              <Input label="SKU / Referência" value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="Ex: CHAMP-001" />
              <div style={{ gridColumn: "1 / -1" }}>
                <Textarea label="Descrição" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Descrição opcional do produto..." rows={2} />
              </div>
            </div>
          </Card>

          <Card>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", marginBottom: "16px" }}>Preço e stock</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Input label="Preço de venda (€) *" type="number" step="0.01" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" required />
              <Input label="Preço de custo (€)" type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => update("costPrice", e.target.value)} placeholder="0.00" />
              <Input label="Stock actual" type="number" min="0" value={form.stock} onChange={(e) => update("stock", e.target.value)} />
              <Input label="Stock mínimo" type="number" min="0" value={form.minStock} onChange={(e) => update("minStock", e.target.value)} />
              <Input label="Unidade" value={form.unit} onChange={(e) => update("unit", e.target.value)} placeholder="Ex: un, ml, kg" />
            </div>
          </Card>

          {error && <p style={{ fontSize: "14px", color: "#dc2626" }}>{error}</p>}

          <div style={{ display: "flex", gap: "12px" }}>
            <Button type="submit" loading={loading} disabled={!form.name || !form.price}>
              <Save size={15} />
              Guardar produto
            </Button>
            <Link href={`/dashboard/${orgSlug}/catalogo`}>
              <Button type="button" variant="secondary">Cancelar</Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
