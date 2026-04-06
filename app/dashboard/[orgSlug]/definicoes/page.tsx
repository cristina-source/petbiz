import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, type PlanKey } from "@/lib/plans";
import { Check, Crown, Download, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { MembersSection } from "@/components/settings/members-section";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

const PLAN_DESCRIPTIONS: Record<string, string[]> = {
  FREE: [
    "Até 20 clientes",
    "1 utilizador",
    "Módulos base (clientes, pets, agenda)",
    "Catálogo básico",
  ],
  STARTER: [
    "Até 200 clientes",
    "3 utilizadores",
    "Agenda online partilhável",
    "Todos os módulos",
    "Email de confirmação",
  ],
  PRO: [
    "Clientes ilimitados",
    "10 utilizadores",
    "Relatórios avançados",
    "Analytics detalhado",
    "Todos os módulos Pro",
  ],
  TEAM: [
    "Tudo do Pro",
    "Utilizadores ilimitados",
    "Multi-unidade",
    "API de integração",
    "Suporte prioritário",
  ],
};

export default async function DefinicoesPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
    include: { subscription: true, members: { include: { user: true } } },
  });
  if (!org) redirect("/onboarding");

  const currentPlan = (org.subscription?.plan ?? "FREE") as PlanKey;

  return (
    // [ITERATE v3] — Convertido de Tailwind para inline styles (fix Tailwind v4)
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar title="Definições" orgSlug={orgSlug} />

      <main style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Plano actual */}
        <Card>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>Plano actual</p>
              <p style={{ fontSize: "13px", color: "var(--app-text-muted)", marginTop: "2px" }}>Gere a tua subscrição</p>
            </div>
            <Badge status={org.subscription?.status ?? "FREE"}>
              {PLANS[currentPlan].name}
            </Badge>
          </div>

          <div className="grid-4-cols" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {(["FREE", "STARTER", "PRO", "TEAM"] as PlanKey[]).map((planKey) => {
              const plan = PLANS[planKey];
              const isCurrent = planKey === currentPlan;
              const features = PLAN_DESCRIPTIONS[planKey] ?? [];
              return (
                <div
                  key={planKey}
                  className="card-hover"
                  style={{
                    borderRadius: "var(--radius)",
                    border: isCurrent ? "2px solid var(--brand-500)" : "2px solid var(--border)",
                    background: isCurrent ? "var(--brand-50)" : "var(--card-bg)",
                    padding: "20px",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <p style={{ fontWeight: 700, color: "var(--app-text)", margin: 0 }}>{plan.name}</p>
                    {isCurrent && <Crown size={14} style={{ color: "var(--brand-600)" }} />}
                  </div>
                  <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--app-text)", margin: "0 0 2px" }}>
                    {plan.price === 0 ? "Grátis" : `${plan.price}€`}
                    {plan.price > 0 && (
                      <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--app-text-muted)" }}>/mês</span>
                    )}
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "16px 0", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--app-text-muted)" }}>
                        <Check size={12} style={{ color: "var(--brand-600)", flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && plan.price > 0 && (
                    <form action="/api/billing/checkout" method="POST">
                      <input type="hidden" name="planKey" value={planKey} />
                      <input type="hidden" name="orgSlug" value={orgSlug} />
                      <button
                        type="submit"
                        style={{ width: "100%", height: "36px", borderRadius: "var(--radius-sm)", background: "var(--brand-600)", color: "#ffffff", fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer" }}
                      >
                        Upgrade
                      </button>
                    </form>
                  )}
                  {isCurrent && (
                    <p style={{ fontSize: "12px", textAlign: "center", color: "var(--brand-600)", fontWeight: 500, margin: 0 }}>
                      Plano actual
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Membros */}
        <MembersSection
          orgSlug={orgSlug}
          currentUserId={session.user.id}
          initialMembers={org.members.map((m) => ({
            id: m.id,
            role: m.role,
            user: { id: m.user.id, name: m.user.name, email: m.user.email },
          }))}
        />

        {/* Info da organização */}
        <Card>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: "0 0 16px" }}>Informações do negócio</p>
          <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
            <div>
              <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginBottom: "2px" }}>Nome</p>
              <p style={{ fontWeight: 500, color: "var(--app-text)", margin: 0 }}>{org.businessName ?? org.name}</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginBottom: "2px" }}>Slug</p>
              <p style={{ fontFamily: "monospace", fontSize: "13px", color: "var(--app-text)", margin: 0 }}>{org.slug}</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginBottom: "2px" }}>Cidade</p>
              <p style={{ fontWeight: 500, color: "var(--app-text)", margin: 0 }}>{org.city ?? "—"}</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginBottom: "2px" }}>Tipo de negócio</p>
              <p style={{ fontWeight: 500, color: "var(--app-text)", margin: 0 }}>{org.businessType ?? "—"}</p>
            </div>
          </div>
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <Link
              href={`/dashboard/${orgSlug}/definicoes/editar`}
              style={{ fontSize: "13px", color: "var(--brand-600)", textDecoration: "none" }}
            >
              Editar informações
            </Link>
          </div>
        </Card>

        {/* Dados e exportação */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Download size={16} style={{ color: "var(--brand-600)" }} />
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>Dados e exportação</p>
          </div>
          <p style={{ fontSize: "13px", color: "var(--app-text-muted)", marginBottom: "16px" }}>
            Exporta os teus dados em formato CSV para backup ou análise externa.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <a
              href={`/api/orgs/${orgSlug}/clientes/export`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                height: "36px", padding: "0 16px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--gray-50)",
                color: "var(--app-text)", fontSize: "13px", fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <Download size={13} /> Clientes
            </a>
            <a
              href={`/api/orgs/${orgSlug}/transactions/export`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                height: "36px", padding: "0 16px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--gray-50)",
                color: "var(--app-text)", fontSize: "13px", fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <Download size={13} /> Financeiro
            </a>
          </div>
        </Card>

        {/* Segurança */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Shield size={16} style={{ color: "var(--brand-600)" }} />
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>Segurança</p>
          </div>
          <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
            <div>
              <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginBottom: "2px" }}>Autenticação</p>
              <p style={{ fontWeight: 500, color: "var(--app-text)", margin: 0 }}>Google OAuth (SSO)</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginBottom: "2px" }}>Controlo de acesso</p>
              <p style={{ fontWeight: 500, color: "var(--app-text)", margin: 0 }}>Whitelist de emails + RBAC</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginBottom: "2px" }}>Eliminação de dados</p>
              <p style={{ fontWeight: 500, color: "var(--app-text)", margin: 0 }}>Soft delete (recuperável)</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginBottom: "2px" }}>Audit log</p>
              <p style={{ fontWeight: 500, color: "var(--app-text)", margin: 0 }}>Todas as acções registadas</p>
            </div>
          </div>
        </Card>

        {/* Zona de perigo */}
        <div style={{ borderRadius: "var(--radius)", border: "1px solid var(--status-cancelled, #fecaca)", background: "rgba(239,68,68,0.04)", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Trash2 size={16} style={{ color: "var(--status-cancelled, #dc2626)" }} />
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--status-cancelled, #dc2626)", margin: 0 }}>Zona de perigo</p>
          </div>
          <p style={{ fontSize: "13px", color: "var(--app-text-muted)", marginBottom: "16px" }}>
            Estas acções são irreversíveis. Tem a certeza que queres continuar?
          </p>
          <button
            disabled
            style={{
              height: "36px", padding: "0 16px", borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(239,68,68,0.3)", background: "var(--card-bg)", color: "var(--status-cancelled, #dc2626)",
              fontSize: "13px", fontWeight: 600, cursor: "not-allowed", opacity: 0.6,
            }}
          >
            Eliminar organização
          </button>
          <p style={{ fontSize: "11px", color: "var(--app-text-muted)", marginTop: "8px" }}>
            Contacta o suporte para eliminar permanentemente a tua conta e dados.
          </p>
        </div>
      </main>
    </div>
  );
}
