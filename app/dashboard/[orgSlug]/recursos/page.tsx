import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, ClipboardList, CheckSquare, Calculator, ExternalLink } from "lucide-react";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  GUIDE: BookOpen,
  TEMPLATE: FileText,
  SOP: ClipboardList,
  CHECKLIST: CheckSquare,
  CALCULATOR: Calculator,
};

const TYPE_LABELS: Record<string, string> = {
  GUIDE: "Guia",
  TEMPLATE: "Template",
  SOP: "SOP",
  CHECKLIST: "Checklist",
  CALCULATOR: "Calculadora",
};

const TYPE_COLORS: Record<string, "brand" | "info" | "default" | "success" | "warning" | "danger" | "purple"> = {
  GUIDE: "brand",
  TEMPLATE: "info",
  SOP: "purple",
  CHECKLIST: "success",
  CALCULATOR: "warning",
};

const BUILT_IN_RESOURCES = [
  { id: "guide-grooming", title: "Como montar um negócio de Grooming", description: "Passo a passo para lançar um serviço de tosquia e estética animal profissional.", type: "GUIDE", category: "Grooming" },
  { id: "checklist-hotel", title: "Checklist Hotel para Pets", description: "Lista completa de verificação para operações de check-in, check-out e cuidados diários.", type: "CHECKLIST", category: "Hotel / Creche" },
  { id: "template-anamnese", title: "Ficha de Anamnese Veterinária", description: "Template completo para consultas veterinárias e historial clínico.", type: "TEMPLATE", category: "Clínica Veterinária" },
  { id: "template-hospedagem", title: "Contrato de Hospedagem", description: "Modelo de contrato para hotel e creche de animais com termos e condições.", type: "TEMPLATE", category: "Hotel / Creche" },
  { id: "template-autorizacao", title: "Termo de Autorização de Procedimentos", description: "Documento legal para autorização de intervenções veterinárias ou de grooming.", type: "TEMPLATE", category: "Clínica Veterinária" },
  { id: "sop-checkin", title: "SOP — Processo de Check-in/Check-out", description: "Procedimento operacional padrão para recepção e entrega de animais.", type: "SOP", category: "Hotel / Creche" },
  { id: "sop-emergencia", title: "Protocolo de Emergência", description: "Procedimentos a seguir em caso de emergência médica com um animal.", type: "SOP", category: "Geral" },
  { id: "calc-precificacao", title: "Calculadora de Precificação de Serviços", description: "Calcula o preço justo para cada serviço tendo em conta custos, margem e mercado.", type: "CALCULATOR", category: "Financeiro" },
  { id: "guide-petsitter", title: "Guia de Arranque — Pet Sitter", description: "Tudo o que precisas para lançar um serviço de cuidados ao domicílio.", type: "GUIDE", category: "Pet Sitter" },
  { id: "guide-pricing", title: "Estratégia de Preços para Negócios Pet", description: "Como posicionar os teus preços face à concorrência e garantir rentabilidade.", type: "GUIDE", category: "Financeiro" },
];

export default async function RecursosPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
  });
  if (!org) redirect("/onboarding");

  const categories = [...new Set(BUILT_IN_RESOURCES.map((r) => r.category))].sort();

  return (
    // [ITERATE v3] — Convertido de Tailwind para inline styles
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Biblioteca de Recursos" orgSlug={orgSlug} />

      <main style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Hero banner */}
        <div style={{ borderRadius: "var(--radius-lg)", padding: "28px 32px", background: "var(--brand-600)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: "0 0 6px" }}>
            Biblioteca de Recursos PetBiz
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", margin: "0 0 20px" }}>
            Guias, templates, SOPs e calculadoras para estruturar e escalar o teu negócio.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {Object.entries(TYPE_LABELS).map(([type, label]) => {
              const Icon = TYPE_ICONS[type];
              const count = BUILT_IN_RESOURCES.filter((r) => r.type === type).length;
              return (
                <div
                  key={type}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "100px", padding: "4px 12px", fontSize: "12px", fontWeight: 500, background: "rgba(255,255,255,0.15)", color: "#ffffff" }}
                >
                  <Icon size={12} />
                  {label} ({count})
                </div>
              );
            })}
          </div>
        </div>

        {/* Recursos por categoria */}
        {categories.map((cat) => {
          const resources = BUILT_IN_RESOURCES.filter((r) => r.category === cat);
          return (
            <div key={cat}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--app-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                {cat}
              </p>
              <div className="grid-3-cols" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                {resources.map((resource) => {
                  const Icon = TYPE_ICONS[resource.type] ?? BookOpen;
                  return (
                    <Card key={resource.id} className="card-hover">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div
                          style={{ width: "36px", height: "36px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)", background: "var(--brand-50)" }}
                        >
                          <Icon size={17} style={{ color: "var(--brand-600)" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ marginBottom: "6px" }}>
                            <Badge variant={TYPE_COLORS[resource.type]}>
                              {TYPE_LABELS[resource.type]}
                            </Badge>
                          </div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)", margin: "0 0 4px", lineHeight: 1.4 }}>
                            {resource.title}
                          </p>
                          <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
                            {resource.description}
                          </p>
                          <button style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--brand-600)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <ExternalLink size={11} />
                            Ver recurso
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
