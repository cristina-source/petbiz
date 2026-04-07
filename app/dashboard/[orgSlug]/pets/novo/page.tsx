"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";

const SPECIES_OPTIONS = [
  { value: "DOG", label: "Cão" }, { value: "CAT", label: "Gato" },
  { value: "BIRD", label: "Ave" }, { value: "RODENT", label: "Roedor" },
  { value: "REPTILE", label: "Réptil" }, { value: "FISH", label: "Peixe" },
  { value: "RABBIT", label: "Coelho" }, { value: "EXOTIC", label: "Exótico" },
  { value: "OTHER", label: "Outro" },
];

const GENDER_OPTIONS = [
  { value: "MALE", label: "Macho" }, { value: "FEMALE", label: "Fêmea" },
];

const sectionStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "20px",
  paddingBottom: "20px", borderBottom: "1px solid var(--border)",
};

export default function NovoPetPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug as string;
  const presetClientId = searchParams.get("clientId") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({
    name: "", species: "", breed: "", color: "", weight: "", birthDate: "",
    gender: "", microchipNumber: "", isNeutered: false,
    healthConditions: "", allergies: "", medications: "", feedingNotes: "", behaviorNotes: "",
    vetName: "", vetPhone: "", vetClinic: "",
    clientId: presetClientId,
  });

  useEffect(() => {
    if (presetClientId) return;
    fetch(`/api/orgs/${orgSlug}/clientes?limit=200`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.clients ?? []);
        setClients(list.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })));
      })
      .catch(() => {});
  }, [orgSlug, presetClientId]);

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.species || !form.clientId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/pets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const { id } = await res.json();
      router.push(presetClientId ? `/dashboard/${orgSlug}/clientes/${presetClientId}` : `/dashboard/${orgSlug}/pets/${id}`);
    } catch {
      setError("Ocorreu um erro. Tenta novamente.");
      setLoading(false);
    }
  }

  const backHref = presetClientId
    ? `/dashboard/${orgSlug}/clientes/${presetClientId}`
    : `/dashboard/${orgSlug}/pets`;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Novo pet" orgSlug={orgSlug} />
      <main style={{ flex: 1, padding: "20px 28px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: presetClientId ? "Cliente" : "Pets", href: backHref },
            { label: "Novo pet" },
          ]} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px" }}>
          {/* Dados básicos */}
          <Card>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--app-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
              Informações básicas
            </p>
            <div style={{ ...sectionStyle, borderBottom: "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Input label="Nome do pet" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="ex: Bolinha" />
                <Select label="Espécie" options={SPECIES_OPTIONS} placeholder="Seleccionar espécie" value={form.species} onChange={(e) => update("species", e.target.value)} required />
                <Input label="Raça" value={form.breed} onChange={(e) => update("breed", e.target.value)} placeholder="ex: Labrador" />
                <Input label="Cor" value={form.color} onChange={(e) => update("color", e.target.value)} placeholder="ex: Castanho" />
                <Input label="Peso (kg)" type="number" step="0.1" min="0" value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="ex: 8.5" />
                <Input label="Data de nascimento" type="date" value={form.birthDate} onChange={(e) => update("birthDate", e.target.value)} />
                <Select label="Sexo" options={GENDER_OPTIONS} placeholder="Seleccionar" value={form.gender} onChange={(e) => update("gender", e.target.value)} />
                <Input label="Microchip" value={form.microchipNumber} onChange={(e) => update("microchipNumber", e.target.value)} placeholder="15 dígitos" />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--app-text)", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isNeutered} onChange={(e) => update("isNeutered", e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "var(--brand-600)" }} />
                Castrado/a
              </label>
              {!presetClientId && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Select
                    label="Tutor"
                    options={clients}
                    placeholder={clients.length === 0 ? "A carregar clientes..." : "Seleccionar tutor"}
                    value={form.clientId}
                    onChange={(e) => update("clientId", e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Saúde */}
          <Card>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--app-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
              Saúde e cuidados
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Textarea label="Condições de saúde" value={form.healthConditions} onChange={(e) => update("healthConditions", e.target.value)} placeholder="Doenças crónicas, condições especiais..." />
              <Textarea label="Alergias" value={form.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="Alergias a alimentos, medicamentos..." />
              <Textarea label="Medicação habitual" value={form.medications} onChange={(e) => update("medications", e.target.value)} placeholder="Nome do medicamento, dose, frequência..." />
              <Textarea label="Notas de alimentação" value={form.feedingNotes} onChange={(e) => update("feedingNotes", e.target.value)} placeholder="Ração, quantidade, horários..." />
              <Textarea label="Notas de comportamento" value={form.behaviorNotes} onChange={(e) => update("behaviorNotes", e.target.value)} placeholder="Temperamento, reacções a outros animais..." />
            </div>
          </Card>

          {/* Veterinário */}
          <Card>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--app-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
              Veterinário habitual
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Input label="Nome do veterinário" value={form.vetName} onChange={(e) => update("vetName", e.target.value)} placeholder="Dr. João Silva" />
              <Input label="Telefone" type="tel" value={form.vetPhone} onChange={(e) => update("vetPhone", e.target.value)} placeholder="+351 912 345 678" />
              <Input label="Clínica" value={form.vetClinic} onChange={(e) => update("vetClinic", e.target.value)} placeholder="Nome da clínica" style={{ gridColumn: "1 / -1" }} />
            </div>
          </Card>

          {error && <p style={{ fontSize: "13px", color: "#dc2626" }}>{error}</p>}

          <div style={{ display: "flex", gap: "12px" }}>
            <Button type="submit" loading={loading}><Save size={15} /> Guardar pet</Button>
            <Link href={backHref}><Button type="button" variant="secondary">Cancelar</Button></Link>
          </div>
        </form>
      </main>
    </div>
  );
}
