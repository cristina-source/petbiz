"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, slugify, SPECIES_LABELS, SPECIES_EMOJI } from "@/lib/utils";
import {
  PawPrint, ArrowRight, ArrowLeft, Check,
  Store, Scissors, Stethoscope, House, UserRound, Dumbbell, Truck, Layers,
  TrendingUp, Package, CreditCard, Repeat,
  Building2, Tag, Users, Clock, DollarSign,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Tipo de negócio", desc: "Que tipo de negócio tens?", icon: Building2 },
  { id: 2, label: "Identidade", desc: "Nome e localização", icon: Tag },
  { id: 3, label: "Espécies", desc: "Animais que atendes", icon: Users },
  { id: 4, label: "Serviços", desc: "O que ofereces", icon: Clock },
  { id: 5, label: "Modelo de receita", desc: "Como geras receita", icon: DollarSign },
];

const BUSINESS_TYPES = [
  { value: "PET_SHOP", label: "Pet Shop", desc: "Venda de produtos e acessórios", icon: Store },
  { value: "GROOMING", label: "Grooming", desc: "Banho, tosa e estética", icon: Scissors },
  { value: "VET_CLINIC", label: "Clínica Veterinária", desc: "Consultas e tratamentos", icon: Stethoscope },
  { value: "PET_HOTEL", label: "Hotel / Creche", desc: "Hospedagem e creche diurna", icon: House },
  { value: "PET_SITTER", label: "Pet Sitter", desc: "Cuidados no domicílio", icon: UserRound },
  { value: "TRAINING", label: "Adestramento", desc: "Treino e comportamento", icon: Dumbbell },
  { value: "DELIVERY", label: "Delivery", desc: "Entrega de produtos pet", icon: Truck },
  { value: "MULTI", label: "Negócio Misto", desc: "Vários serviços combinados", icon: Layers },
];

const SPECIES_OPTIONS = ["DOG", "CAT", "BIRD", "RODENT", "REPTILE", "FISH", "RABBIT", "EXOTIC", "OTHER"];

const REVENUE_MODELS = [
  { value: "PER_SERVICE", label: "Por serviço", desc: "Cobro por cada serviço ou consulta", icon: CreditCard },
  { value: "SUBSCRIPTION", label: "Mensalidade", desc: "Planos mensais para clientes recorrentes", icon: Repeat },
  { value: "PRODUCT", label: "Venda de produtos", desc: "Receita principal via produtos", icon: Package },
  { value: "DELIVERY", label: "Delivery", desc: "Entregas de produtos ao domicílio", icon: Truck },
  { value: "HYBRID", label: "Misto", desc: "Combinação de serviços e produtos", icon: TrendingUp },
];

interface FormData {
  businessType: string;
  businessName: string;
  city: string;
  openTime: string;
  closeTime: string;
  species: string[];
  services: string;
  revenueModel: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<FormData>({
    businessType: "", businessName: "", city: "",
    openTime: "09:00", closeTime: "18:00",
    species: [], services: "", revenueModel: "",
  });

  function toggleSpecies(s: string) {
    setData((d) => ({
      ...d,
      species: d.species.includes(s) ? d.species.filter((x) => x !== s) : [...d.species, s],
    }));
  }

  function canProceed() {
    if (step === 1) return !!data.businessType;
    if (step === 2) return !!data.businessName && !!data.city;
    if (step === 3) return data.species.length > 0;
    if (step === 5) return !!data.revenueModel;
    return true;
  }

  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, slug: slugify(data.businessName) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Erro ${res.status}`);
      }
      const { orgSlug } = await res.json();
      router.push(`/dashboard/${orgSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo correu mal. Tenta novamente.");
      setLoading(false);
    }
  }

  const currentStep = STEPS[step - 1];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)" }}>

      {/* Mobile header */}
      <header className="md:hidden" style={{ borderBottom: "1px solid var(--border)", background: "var(--background)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PawPrint size={14} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--app-text)" }}>PetBiz</span>
        </div>
        <span style={{ fontSize: "13px", color: "var(--app-text-muted)" }}>Passo {step} de {STEPS.length}</span>
      </header>

      {/* Main split layout */}
      <div style={{ flex: 1, display: "flex" }}>

        {/* ── Left sidebar ─────────────────────────────── */}
        <aside className="hidden md:flex" style={{ width: "320px", flexShrink: 0, background: "var(--brand-700)", flexDirection: "column", padding: "40px 32px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PawPrint size={17} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "17px", color: "white" }}>PetBiz</span>
          </div>

          {/* Steps list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
            {STEPS.map((s) => {
              const isDone = step > s.id;
              const isCurrent = step === s.id;
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", borderRadius: "10px",
                    background: isCurrent ? "rgba(255,255,255,0.12)" : "transparent",
                    transition: "background 0.2s ease",
                  }}
                >
                  {/* Circle */}
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isDone ? "rgba(255,255,255,0.9)" : isCurrent ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                    border: isCurrent ? "2px solid rgba(255,255,255,0.4)" : "none",
                  }}>
                    {isDone
                      ? <Check size={14} style={{ color: "var(--brand-700)" }} />
                      : <Icon size={14} color={isCurrent ? "white" : "rgba(255,255,255,0.45)"} />
                    }
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "white" : isDone ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)", lineHeight: 1.2 }}>
                      {s.label}
                    </p>
                    <p style={{ fontSize: "11px", color: isCurrent ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom tip */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "24px", marginTop: "24px" }}>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              Configuração completa em menos de 5 minutos. Podes alterar tudo depois.
            </p>
          </div>
        </aside>

        {/* ── Right content area ───────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--background-subtle)" }}>

          {/* Progress bar */}
          <div style={{ height: "3px", background: "var(--gray-200)" }}>
            <div style={{ height: "100%", width: `${(step / STEPS.length) * 100}%`, background: "var(--brand-500)", transition: "width 0.4s ease" }} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "48px 48px 32px", maxWidth: "680px", width: "100%", margin: "0 auto" }}>

            {/* Step header */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--brand-600)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Passo {step} de {STEPS.length}
                </span>
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--app-text)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {currentStep.label}
              </h1>
            </div>

            {/* Step 1 — Tipo de negócio */}
            {step === 1 && (
              <div>
                <p style={{ fontSize: "14px", color: "var(--app-text-muted)", marginBottom: "20px" }}>
                  A plataforma adapta-se ao teu tipo de negócio.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                  {BUSINESS_TYPES.map((b) => {
                    const Icon = b.icon;
                    const selected = data.businessType === b.value;
                    return (
                      <button
                        key={b.value}
                        onClick={() => setData((d) => ({ ...d, businessType: b.value }))}
                        style={{
                          display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px",
                          borderRadius: "12px", textAlign: "left", cursor: "pointer",
                          border: selected ? "2px solid var(--brand-500)" : "1.5px solid var(--border)",
                          background: selected ? "var(--brand-50)" : "var(--card-bg)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: selected ? "var(--brand-100)" : "var(--gray-100)" }}>
                          <Icon size={18} style={{ color: selected ? "var(--brand-700)" : "var(--gray-500)" }} />
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", lineHeight: 1.2 }}>{b.label}</p>
                          <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginTop: "2px" }}>{b.desc}</p>
                        </div>
                        {selected && (
                          <div style={{ marginLeft: "auto", width: "20px", height: "20px", borderRadius: "50%", background: "var(--brand-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Check size={11} color="white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2 — Identidade */}
            {step === 2 && (
              <div>
                <p style={{ fontSize: "14px", color: "var(--app-text-muted)", marginBottom: "24px" }}>
                  Como se chama o teu negócio e onde estás localizado?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Input label="Nome do negócio" placeholder="ex: Patas & Amor" value={data.businessName} onChange={(e) => setData((d) => ({ ...d, businessName: e.target.value }))} required />
                  <Input label="Cidade" placeholder="ex: Lisboa" value={data.city} onChange={(e) => setData((d) => ({ ...d, city: e.target.value }))} required />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <Input label="Abertura" type="time" value={data.openTime} onChange={(e) => setData((d) => ({ ...d, openTime: e.target.value }))} />
                    <Input label="Fecho" type="time" value={data.closeTime} onChange={(e) => setData((d) => ({ ...d, closeTime: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Espécies */}
            {step === 3 && (
              <div>
                <p style={{ fontSize: "14px", color: "var(--app-text-muted)", marginBottom: "20px" }}>
                  Podes seleccionar várias espécies.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {SPECIES_OPTIONS.map((s) => {
                    const selected = data.species.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSpecies(s)}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                          padding: "16px 12px", borderRadius: "12px", cursor: "pointer",
                          border: selected ? "2px solid var(--brand-500)" : "1.5px solid var(--border)",
                          background: selected ? "var(--brand-50)" : "var(--card-bg)",
                          position: "relative",
                        }}
                      >
                        <span style={{ fontSize: "28px", lineHeight: 1 }}>{SPECIES_EMOJI[s]}</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--app-text)" }}>{SPECIES_LABELS[s]}</span>
                        {selected && (
                          <div style={{ position: "absolute", top: "8px", right: "8px", width: "16px", height: "16px", borderRadius: "50%", background: "var(--brand-500)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={9} color="white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4 — Serviços */}
            {step === 4 && (
              <div>
                <p style={{ fontSize: "14px", color: "var(--app-text-muted)", marginBottom: "20px" }}>
                  Descreve os teus serviços principais. Podes configurar em detalhe depois.
                </p>
                <textarea
                  rows={6}
                  placeholder="ex: Banho e tosa, consultas de medicina preventiva, internamento, venda de rações premium..."
                  value={data.services}
                  onChange={(e) => setData((d) => ({ ...d, services: e.target.value }))}
                  style={{
                    width: "100%", borderRadius: "12px", padding: "14px 16px", fontSize: "14px",
                    border: "1.5px solid var(--border)", background: "var(--card-bg)", color: "var(--app-text)",
                    resize: "none", outline: "none", lineHeight: 1.6,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-focus)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-100)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginTop: "8px" }}>Campo opcional — podes saltar e configurar depois.</p>
              </div>
            )}

            {/* Step 5 — Receita */}
            {step === 5 && (
              <div>
                <p style={{ fontSize: "14px", color: "var(--app-text-muted)", marginBottom: "20px" }}>
                  Isto ajuda-nos a configurar o módulo financeiro.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {REVENUE_MODELS.map((m) => {
                    const Icon = m.icon;
                    const selected = data.revenueModel === m.value;
                    return (
                      <button
                        key={m.value}
                        onClick={() => setData((d) => ({ ...d, revenueModel: m.value }))}
                        style={{
                          display: "flex", alignItems: "center", gap: "16px", padding: "14px 16px",
                          borderRadius: "12px", textAlign: "left", cursor: "pointer",
                          border: selected ? "2px solid var(--brand-500)" : "1.5px solid var(--border)",
                          background: selected ? "var(--brand-50)" : "var(--card-bg)",
                        }}
                      >
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: selected ? "var(--brand-100)" : "var(--gray-100)" }}>
                          <Icon size={18} style={{ color: selected ? "var(--brand-700)" : "var(--gray-500)" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)" }}>{m.label}</p>
                          <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginTop: "2px" }}>{m.desc}</p>
                        </div>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${selected ? "var(--brand-500)" : "var(--gray-300)"}`, background: selected ? "var(--brand-500)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {selected && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ marginTop: "16px", padding: "10px 14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", fontSize: "13px", color: "#dc2626" }}>
                {error}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className={cn(step === 1 && "invisible")}
              >
                <ArrowLeft size={15} /> Anterior
              </Button>

              {step < STEPS.length ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
                  Próximo <ArrowRight size={15} />
                </Button>
              ) : (
                <Button onClick={handleFinish} loading={loading} disabled={!canProceed()}>
                  <Check size={15} /> Concluir configuração
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
