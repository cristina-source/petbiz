"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";

const TYPE_OPTIONS = [
  { value: "INCOME", label: "Receita" },
  { value: "EXPENSE", label: "Despesa" },
  { value: "REFUND", label: "Reembolso" },
];

const METHOD_OPTIONS = [
  { value: "CASH", label: "Numerário" },
  { value: "CARD", label: "Cartão" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "MBWAY", label: "MB Way" },
  { value: "MULTIBANCO", label: "Multibanco" },
  { value: "OTHER", label: "Outro" },
];

const STATUS_OPTIONS = [
  { value: "PAID", label: "Pago" },
  { value: "PENDING", label: "Pendente" },
  { value: "OVERDUE", label: "Em atraso" },
];

export default function NovaTransacaoPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    type: "INCOME",
    amount: "",
    description: "",
    method: "CARD",
    status: "PAID",
    date: today,
    notes: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || !form.type) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push(`/dashboard/${orgSlug}/financeiro`);
    } catch {
      setError("Ocorreu um erro. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Registar transacção" orgSlug={orgSlug} />
      <main style={{ flex: 1, padding: "20px 28px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: "Financeiro", href: `/dashboard/${orgSlug}/financeiro` },
            { label: "Nova transacção" },
          ]} />
        </div>

        <Card style={{ maxWidth: "560px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Select label="Tipo" options={TYPE_OPTIONS} value={form.type} onChange={(e) => update("type", e.target.value)} required />
              <Input label="Valor (€)" type="number" step="0.01" min="0" value={form.amount} onChange={(e) => update("amount", e.target.value)} required placeholder="0,00" />
              <Input
                label="Descrição"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="ex: Banho e Tosquia — Bolinha"
                style={{ gridColumn: "1 / -1" }}
              />
              <Select label="Método de pagamento" options={METHOD_OPTIONS} value={form.method} onChange={(e) => update("method", e.target.value)} />
              <Select label="Estado" options={STATUS_OPTIONS} value={form.status} onChange={(e) => update("status", e.target.value)} />
              <Input label="Data" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
            </div>
            <Textarea label="Notas" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Informações adicionais..." />
            {error && <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: "12px" }}>
              <Button type="submit" loading={loading}>
                <Save size={15} /> Guardar transacção
              </Button>
              <Link href={`/dashboard/${orgSlug}/financeiro`}>
                <Button type="button" variant="secondary">Cancelar</Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
