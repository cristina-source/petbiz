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

export default function NovoClientePage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", taxId: "", address: "", city: "", notes: "" });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const { id } = await res.json();
      router.push(`/dashboard/${orgSlug}/clientes/${id}`);
    } catch {
      setError("Ocorreu um erro. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Novo cliente" orgSlug={orgSlug} />
      <main style={{ flex: 1, padding: "20px 28px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: "Clientes", href: `/dashboard/${orgSlug}/clientes` },
            { label: "Novo cliente" },
          ]} />
        </div>

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
            <Textarea label="Notas" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Informações adicionais sobre o cliente..." />
            {error && <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: "12px" }}>
              <Button type="submit" loading={loading}><Save size={15} /> Guardar cliente</Button>
              <Link href={`/dashboard/${orgSlug}/clientes`}>
                <Button type="button" variant="secondary">Cancelar</Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
