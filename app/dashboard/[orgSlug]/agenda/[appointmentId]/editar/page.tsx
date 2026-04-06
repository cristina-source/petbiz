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

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Client {
  id: string;
  name: string;
  pets: { id: string; name: string; species: string }[];
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "IN_PROGRESS", label: "Em curso" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "NO_SHOW", label: "Não compareceu" },
];

export default function EditarAgendamentoPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const appointmentId = params.appointmentId as string;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [form, setForm] = useState({
    clientId: "",
    petId: "",
    serviceId: "",
    date: "",
    time: "09:00",
    status: "CONFIRMED",
    notes: "",
    price: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/orgs/${orgSlug}/clientes`).then((r) => r.json()),
      fetch(`/api/orgs/${orgSlug}/servicos`).then((r) => r.json()),
      fetch(`/api/orgs/${orgSlug}/appointments/${appointmentId}`).then((r) => r.json()),
    ]).then(([c, s, appt]) => {
      setClients(c);
      setServices(s);
      if (appt && appt.id) {
        const d = new Date(appt.date);
        setForm({
          clientId: appt.clientId ?? "",
          petId: appt.petId ?? "",
          serviceId: appt.serviceId ?? "",
          date: d.toISOString().split("T")[0],
          time: d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
          status: appt.status ?? "CONFIRMED",
          notes: appt.notes ?? "",
          price: appt.price != null ? String(appt.price) : "",
        });
      }
      setFetching(false);
    }).catch(() => { setError("Erro ao carregar dados."); setFetching(false); });
  }, [orgSlug, appointmentId]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
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

      const res = await fetch(`/api/orgs/${orgSlug}/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          date: dateISO,
          endDate,
          petId: form.petId || null,
          serviceId: form.serviceId || null,
          notes: form.notes || null,
          price: form.price ? parseFloat(form.price) : null,
        }),
      });
      if (!res.ok) throw new Error();
      router.push(`/dashboard/${orgSlug}/agenda?date=${form.date}`);
    } catch {
      setError("Ocorreu um erro. Tenta novamente.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Tens a certeza que queres eliminar esta marcação?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/orgs/${orgSlug}/appointments/${appointmentId}`, { method: "DELETE" });
      router.push(`/dashboard/${orgSlug}/agenda`);
    } catch {
      setError("Erro ao eliminar.");
      setDeleting(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    height: "38px", width: "100%", borderRadius: "8px",
    border: "1.5px solid var(--border)", background: "var(--input-bg)",
    padding: "0 12px", fontSize: "14px", color: "var(--app-text)",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Editar marcação" orgSlug={orgSlug} />
      <main style={{ flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: "Agenda", href: `/dashboard/${orgSlug}/agenda` },
            { label: "Editar marcação" },
          ]} />
        </div>

        {fetching ? (
          <p style={{ fontSize: "14px", color: "var(--app-text-muted)" }}>A carregar...</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ maxWidth: "520px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <Card>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", marginBottom: "16px" }}>
                Detalhes do agendamento
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Cliente */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)" }}>
                    Cliente <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select value={form.clientId} onChange={(e) => update("clientId", e.target.value)} required style={selectStyle}>
                    <option value="">Seleccionar cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Pet */}
                {selectedClient && selectedClient.pets.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)" }}>Pet</label>
                    <select value={form.petId} onChange={(e) => update("petId", e.target.value)} style={selectStyle}>
                      <option value="">Seleccionar pet (opcional)...</option>
                      {selectedClient.pets.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Serviço */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)" }}>Serviço</label>
                  <select value={form.serviceId} onChange={(e) => update("serviceId", e.target.value)} style={selectStyle}>
                    <option value="">Seleccionar serviço (opcional)...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} — {s.duration}min</option>
                    ))}
                  </select>
                </div>

                {/* Data e hora */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Input label="Data" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
                  <Input label="Hora" type="time" value={form.time} onChange={(e) => update("time", e.target.value)} />
                </div>

                {selectedService && (
                  <p style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>
                    Duração: {selectedService.duration} min
                    {form.date && form.time && ` · Fim: ${computeEndDate()?.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                )}

                {/* Estado */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)" }}>Estado</label>
                  <select value={form.status} onChange={(e) => update("status", e.target.value)} style={selectStyle}>
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Preço */}
                <Input label="Valor (€)" type="number" step="0.01" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" />

                {/* Notas */}
                <Textarea label="Notas" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Observações para este agendamento..." rows={2} />
              </div>
            </Card>

            {error && <p style={{ fontSize: "13px", color: "#dc2626" }}>{error}</p>}

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Button type="submit" loading={loading} disabled={!form.clientId || !form.date}>
                <Save size={15} />
                Guardar alterações
              </Button>
              <Link href={`/dashboard/${orgSlug}/agenda`}>
                <Button type="button" variant="secondary">Cancelar</Button>
              </Link>
              <div style={{ marginLeft: "auto" }}>
                <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>
                  <Trash2 size={14} />
                  Eliminar
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
