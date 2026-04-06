"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  pets: { id: string; name: string; species: string }[];
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug as string;
  const presetClientId = searchParams.get("clientId") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [form, setForm] = useState({
    clientId: presetClientId,
    petId: "",
    serviceId: "",
    date: "",
    time: "09:00",
    notes: "",
    price: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/orgs/${orgSlug}/clientes`).then((r) => r.json()),
      fetch(`/api/orgs/${orgSlug}/servicos`).then((r) => r.json()),
    ]).then(([c, s]) => {
      setClients(c);
      setServices(s);
    });
  }, [orgSlug]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    // Auto-preencher preço ao seleccionar serviço
    if (field === "serviceId") {
      const svc = services.find((s) => s.id === value);
      if (svc) setForm((f) => ({ ...f, serviceId: value, price: String(svc.price) }));
    }
  }

  const selectedClient = clients.find((c) => c.id === form.clientId);
  const selectedService = services.find((s) => s.id === form.serviceId);

  function computeEndDate(): Date | null {
    if (!form.date || !form.time) return null;
    const start = new Date(`${form.date}T${form.time}`);
    const duration = selectedService?.duration ?? 60;
    return new Date(start.getTime() + duration * 60000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.date) return;
    setLoading(true);
    setError("");
    try {
      const dateISO = new Date(`${form.date}T${form.time}`).toISOString();
      const endDate = computeEndDate()?.toISOString();

      const res = await fetch(`/api/orgs/${orgSlug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          petId: form.petId || undefined,
          serviceId: form.serviceId || undefined,
          date: dateISO,
          endDate,
          notes: form.notes || undefined,
          price: form.price ? parseFloat(form.price) : undefined,
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar agendamento");
      const dateParam = form.date;
      router.push(`/dashboard/${orgSlug}/agenda?date=${dateParam}`);
    } catch {
      setError("Ocorreu um erro. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Novo agendamento" orgSlug={orgSlug} />
      <main style={{ flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: "Agenda", href: `/dashboard/${orgSlug}/agenda` },
            { label: "Nova marcação" },
          ]} />
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: "520px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", marginBottom: "16px" }}>
              Detalhes do agendamento
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Cliente */}
              {/* [ITERATE v1] — Selects convertidos de Tailwind para inline styles (Tailwind v4 incompatibilidade) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)" }}>
                  Cliente <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={form.clientId}
                  onChange={(e) => update("clientId", e.target.value)}
                  required
                  style={{ height: "38px", width: "100%", borderRadius: "8px", border: "1.5px solid var(--border)", background: "var(--input-bg)", padding: "0 12px", fontSize: "14px", color: "var(--app-text)", outline: "none", boxSizing: "border-box" }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pet */}
              {selectedClient && selectedClient.pets.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)" }}>Pet</label>
                  <select
                    value={form.petId}
                    onChange={(e) => update("petId", e.target.value)}
                    style={{ height: "38px", width: "100%", borderRadius: "8px", border: "1.5px solid var(--border)", background: "var(--input-bg)", padding: "0 12px", fontSize: "14px", color: "var(--app-text)", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="">Seleccionar pet (opcional)...</option>
                    {selectedClient.pets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Serviço */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)" }}>Serviço</label>
                <select
                  value={form.serviceId}
                  onChange={(e) => update("serviceId", e.target.value)}
                  style={{ height: "38px", width: "100%", borderRadius: "8px", border: "1.5px solid var(--border)", background: "var(--input-bg)", padding: "0 12px", fontSize: "14px", color: "var(--app-text)", outline: "none", boxSizing: "border-box" }}
                >
                  <option value="">Seleccionar serviço (opcional)...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.duration}min
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e hora */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Input
                  label="Data"
                  type="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  required
                />
                <Input
                  label="Hora"
                  type="time"
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                />
              </div>

              {selectedService && (
                <p style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>
                  Duração: {selectedService.duration} min
                  {form.date && form.time && ` · Fim: ${computeEndDate()?.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`}
                </p>
              )}

              {/* Preço */}
              <Input
                label="Valor (€)"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="0.00"
              />

              {/* Notas */}
              <Textarea
                label="Notas"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Observações para este agendamento..."
                rows={2}
              />
            </div>
          </Card>

          {error && <p style={{ fontSize: "13px", color: "#dc2626" }}>{error}</p>}

          <div style={{ display: "flex", gap: "12px" }}>
            <Button type="submit" loading={loading} disabled={!form.clientId || !form.date}>
              <Save size={15} />
              Guardar agendamento
            </Button>
            <Link href={`/dashboard/${orgSlug}/agenda`}>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
