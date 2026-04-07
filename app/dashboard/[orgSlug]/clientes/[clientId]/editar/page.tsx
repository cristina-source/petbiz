"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Trash2 } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const clientId = params.clientId as string;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", taxId: "", address: "", city: "", notes: "" });

  useEffect(() => {
    fetch(`/api/orgs/${orgSlug}/clientes/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({ name: data.name ?? "", email: data.email ?? "", phone: data.phone ?? "", taxId: data.taxId ?? "", address: data.address ?? "", city: data.city ?? "", notes: data.notes ?? "" });
        setFetching(false);
      })
      .catch(() => { setError("Erro ao carregar dados."); setFetching(false); });
  }, [orgSlug, clientId]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/clientes/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push(`/dashboard/${orgSlug}/clientes/${clientId}`);
    } catch {
      setError("Ocorreu um erro. Tenta novamente.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Eliminar o cliente "${form.name}"? Esta acção não pode ser desfeita.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/orgs/${orgSlug}/clientes/${clientId}`, { method: "DELETE" });
      router.push(`/dashboard/${orgSlug}/clientes`);
    } catch {
      setError("Erro ao eliminar. Tenta novamente.");
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar
        title={fetching ? "Editar cliente" : `Editar — ${form.name}`}
        orgSlug={orgSlug}
        actions={
          !fetching ? (
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              <Trash2 size={14} /> Eliminar cliente
            </Button>
          ) : undefined
        }
      />
      <main style={{ flex: 1, padding: "20px 28px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: "Clientes", href: `/dashboard/${orgSlug}/clientes` },
            { label: form.name || "Cliente", href: `/dashboard/${orgSlug}/clientes/${clientId}` },
            { label: "Editar" },
          ]} />
        </div>

        {fetching ? (
          <p style={{ fontSize: "14px", color: "var(--app-text-muted)" }}>A carregar...</p>
        ) : (
          <Card style={{ maxWidth: "560px" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Input label="Nome" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Nome do tutor" />
                <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@exemplo.pt" />
                <Input label="Telefone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+351 912 345 678" />
                <Input label="NIF" value={form.taxId} onChange={(e) => update("taxId", e.target.value)} placeholder="123 456 789" />
                <Input label="Morada" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua, número, andar" />
                <Input label="Cidade" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Lisboa" />
              </div>
              <Textarea label="Notas" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Informações adicionais..." />
              {error && <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}
              <div style={{ display: "flex", gap: "12px" }}>
                <Button type="submit" loading={loading}><Save size={15} /> Guardar alterações</Button>
                <Link href={`/dashboard/${orgSlug}/clientes/${clientId}`}>
                  <Button type="button" variant="secondary">Cancelar</Button>
                </Link>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
