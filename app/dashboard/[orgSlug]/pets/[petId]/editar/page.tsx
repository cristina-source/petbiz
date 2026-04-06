"use client";

import { useEffect, useState } from "react";
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

export default function EditarPetPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const petId = params.petId as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", species: "", breed: "", color: "", weight: "", birthDate: "",
    gender: "", microchipNumber: "", isNeutered: false,
    healthConditions: "", allergies: "", medications: "", feedingNotes: "", behaviorNotes: "",
    vetName: "", vetPhone: "", vetClinic: "",
  });

  useEffect(() => {
    fetch(`/api/orgs/${orgSlug}/pets/${petId}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "", species: data.species ?? "", breed: data.breed ?? "",
          color: data.color ?? "", weight: data.weight != null ? String(data.weight) : "",
          birthDate: data.birthDate ? data.birthDate.slice(0, 10) : "",
          gender: data.gender ?? "", microchipNumber: data.microchipNumber ?? "",
          isNeutered: data.isNeutered ?? false,
          healthConditions: data.healthConditions ?? "", allergies: data.allergies ?? "",
          medications: data.medications ?? "", feedingNotes: data.feedingNotes ?? "",
          behaviorNotes: data.behaviorNotes ?? "", vetName: data.vetName ?? "",
          vetPhone: data.vetPhone ?? "", vetClinic: data.vetClinic ?? "",
        });
        setFetching(false);
      })
      .catch(() => { setError("Erro ao carregar dados."); setFetching(false); });
  }, [orgSlug, petId]);

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.species) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/pets/${petId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push(`/dashboard/${orgSlug}/pets/${petId}`);
    } catch {
      setError("Ocorreu um erro. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Editar pet" orgSlug={orgSlug} />
      <main style={{ flex: 1, padding: "20px 28px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Breadcrumbs items={[
            { label: "Pets", href: `/dashboard/${orgSlug}/pets` },
            { label: form.name || "Pet", href: `/dashboard/${orgSlug}/pets/${petId}` },
            { label: "Editar" },
          ]} />
        </div>

        {fetching ? (
          <p style={{ fontSize: "14px", color: "var(--app-text-muted)" }}>A carregar...</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px" }}>
            <Card>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--app-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
                Informações básicas
              </p>
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
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--app-text)", cursor: "pointer", marginTop: "16px" }}>
                <input type="checkbox" checked={form.isNeutered} onChange={(e) => update("isNeutered", e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "var(--brand-600)" }} />
                Castrado/a
              </label>
            </Card>

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
              <Button type="submit" loading={loading}><Save size={15} /> Guardar alterações</Button>
              <Link href={`/dashboard/${orgSlug}/pets/${petId}`}>
                <Button type="button" variant="secondary">Cancelar</Button>
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
