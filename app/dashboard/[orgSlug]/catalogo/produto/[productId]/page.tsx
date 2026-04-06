"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Trash2 } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const productId = params.productId as string;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    sku: "",
    price: "",
    costPrice: "",
    stock: "",
    minStock: "",
    unit: "",
    isActive: true,
  });

  useEffect(() => {
    fetch(`/api/orgs/${orgSlug}/produtos/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          name: d.name ?? "",
          description: d.description ?? "",
          category: d.category ?? "",
          sku: d.sku ?? "",
          price: String(d.price ?? ""),
          costPrice: d.costPrice ? String(d.costPrice) : "",
          stock: String(d.stock ?? 0),
          minStock: String(d.minStock ?? 5),
          unit: d.unit ?? "",
          isActive: d.isActive ?? true,
        });
      });
  }, [orgSlug, productId]);

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/produtos/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push(`/dashboard/${orgSlug}/catalogo`);
    } catch {
      setError("Erro ao guardar. Tenta novamente.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Eliminar este produto?")) return;
    setDeleting(true);
    await fetch(`/api/orgs/${orgSlug}/produtos/${productId}`, { method: "DELETE" });
    router.push(`/dashboard/${orgSlug}/catalogo`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar
        title="Editar produto"
        orgSlug={orgSlug}
        actions={
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            <Trash2 size={14} />
            Eliminar
          </Button>
        }
      />
      <main style={{ flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: "Catálogo", href: `/dashboard/${orgSlug}/catalogo` },
            { label: form.name || "Produto" },
          ]} />
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", marginBottom: "16px" }}>Informações do produto</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Input label="Nome *" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <Input label="Categoria" value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Ex: Higiene" />
              <Input label="SKU / Referência" value={form.sku} onChange={(e) => update("sku", e.target.value)} />
              <div style={{ gridColumn: "1 / -1" }}>
                <Textarea label="Descrição" value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} />
              </div>
            </div>
          </Card>

          <Card>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", marginBottom: "16px" }}>Preço e stock</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Input label="Preço de venda (€) *" type="number" step="0.01" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} required />
              <Input label="Preço de custo (€)" type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => update("costPrice", e.target.value)} />
              <Input label="Stock actual" type="number" min="0" value={form.stock} onChange={(e) => update("stock", e.target.value)} />
              <Input label="Stock mínimo" type="number" min="0" value={form.minStock} onChange={(e) => update("minStock", e.target.value)} />
              <Input label="Unidade" value={form.unit} onChange={(e) => update("unit", e.target.value)} placeholder="Ex: un, ml, kg" />
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)" }}>Produto activo</p>
                <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginTop: "2px" }}>Produtos inactivos não aparecem no catálogo</p>
              </div>
              <button
                type="button"
                onClick={() => update("isActive", !form.isActive)}
                style={{
                  width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
                  background: form.isActive ? "var(--brand-600)" : "var(--gray-300)",
                  transition: "background 0.2s", position: "relative",
                }}
              >
                <span style={{
                  position: "absolute", top: "2px", width: "20px", height: "20px", borderRadius: "50%",
                  background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  transition: "left 0.2s", left: form.isActive ? "22px" : "2px",
                }} />
              </button>
            </div>
          </Card>

          {error && <p style={{ fontSize: "14px", color: "#dc2626" }}>{error}</p>}

          <div style={{ display: "flex", gap: "12px" }}>
            <Button type="submit" loading={loading}>
              <Save size={15} />
              Guardar alterações
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
