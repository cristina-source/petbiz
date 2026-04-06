"use client";

import { useState } from "react";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Props {
  orgSlug: string;
  services: Service[];
}

type Status = "idle" | "loading" | "success" | "error";

export function BookingForm({ orgSlug, services }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    petName: "",
    serviceId: "",
    date: "",
    time: "",
    notes: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.date || !form.time) return;

    setStatus("loading");
    setError("");

    try {
      const dateTime = new Date(`${form.date}T${form.time}:00`);
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug,
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          petName: form.petName || undefined,
          serviceId: form.serviceId || undefined,
          date: dateTime.toISOString(),
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Erro ao submeter");
      }
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo correu mal.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "24px" }}>
          ✓
        </div>
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1f1d18", margin: "0 0 8px" }}>
          Marcação recebida!
        </h3>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
          A tua marcação foi registada com sucesso.
          {form.email && " Receberás uma confirmação por email assim que for aceite."}
        </p>
        <button
          onClick={() => { setStatus("idle"); setForm({ name: "", email: "", phone: "", petName: "", serviceId: "", date: "", time: "", notes: "" }); }}
          style={btnSecondary}
        >
          Nova marcação
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Name */}
      <Field label="Nome do tutor *">
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Maria Silva"
          required
          style={inputStyle}
        />
      </Field>

      {/* Email + Phone */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="maria@email.com"
            style={inputStyle}
          />
        </Field>
        <Field label="Telefone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="912 345 678"
            style={inputStyle}
          />
        </Field>
      </div>

      {/* Pet name */}
      <Field label="Nome do pet">
        <input
          value={form.petName}
          onChange={(e) => set("petName", e.target.value)}
          placeholder="Bolinha"
          style={inputStyle}
        />
      </Field>

      {/* Service */}
      {services.length > 0 && (
        <Field label="Serviço">
          <select
            value={form.serviceId}
            onChange={(e) => set("serviceId", e.target.value)}
            style={inputStyle}
          >
            <option value="">Seleccionar serviço...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — €{s.price.toFixed(2)} ({s.duration}min)
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Date + Time */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Data *">
          <input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            required
            style={inputStyle}
          />
        </Field>
        <Field label="Hora *">
          <input
            type="time"
            value={form.time}
            onChange={(e) => set("time", e.target.value)}
            required
            style={inputStyle}
          />
        </Field>
      </div>

      {/* Notes */}
      <Field label="Notas (opcional)">
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Informação adicional relevante..."
          rows={3}
          style={{ ...inputStyle, resize: "none", height: "auto", lineHeight: "1.5" }}
        />
      </Field>

      {error && (
        <p style={{ fontSize: "13px", color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 12px", margin: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !form.name || !form.date || !form.time}
        style={{
          ...btnPrimary,
          opacity: (status === "loading" || !form.name || !form.date || !form.time) ? 0.6 : 1,
          cursor: (status === "loading" || !form.name || !form.date || !form.time) ? "not-allowed" : "pointer",
        }}
      >
        {status === "loading" ? "A enviar..." : "Confirmar marcação"}
      </button>

      <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", margin: 0 }}>
        Ao submeter, aceitam os nossos termos de serviço. A marcação fica pendente até confirmação.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "38px",
  borderRadius: "8px",
  border: "1.5px solid #d1d5db",
  padding: "0 12px",
  fontSize: "13px",
  color: "#1f1d18",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  height: "42px",
  borderRadius: "10px",
  background: "#1d4ed8",
  color: "white",
  border: "none",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const btnSecondary: React.CSSProperties = {
  height: "38px",
  padding: "0 20px",
  borderRadius: "8px",
  border: "1.5px solid #d1d5db",
  background: "white",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};
