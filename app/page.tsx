import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  PawPrint,
  ArrowRight,
  Calendar,
  TrendingUp,
  Package,
  BookOpen,
  Zap,
  Shield,
  Scissors,
  Stethoscope,
  Store,
  House,
  UserRound,
  Dumbbell,
  Check,
  ChevronRight,
  LayoutDashboard,
  Users,
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.id) {
    const membership = await prisma.orgMember.findFirst({
      where: { userId: session.user.id, organization: { deletedAt: null } },
      include: { organization: true },
      orderBy: { joinedAt: "asc" },
    });
    if (membership?.organization) {
      redirect(`/dashboard/${membership.organization.slug}`);
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <div style={{ background: "var(--background)", color: "var(--app-text)", minHeight: "100vh" }}>

      {/* ── Navbar ─────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--background)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PawPrint size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--app-text)" }}>PetBiz</span>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <a href="#features" style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text-muted)", textDecoration: "none" }}>Funcionalidades</a>
            <a href="#pricing" style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text-muted)", textDecoration: "none" }}>Preços</a>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/login" style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text-muted)", textDecoration: "none" }}>
              Entrar
            </Link>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", fontSize: "14px", fontWeight: 600, color: "white", background: "var(--brand-600)", borderRadius: "8px", textDecoration: "none" }}>
              Começar grátis <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section style={{ background: "var(--background)", padding: "72px 24px 0", textAlign: "center" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--brand-50)", color: "var(--brand-700)", borderRadius: "100px", padding: "5px 14px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "28px" }}>
            <Zap size={11} /> Novo · Onboarding em 5 minutos
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: "var(--app-text)", margin: "0 auto 20px", maxWidth: "720px" }}>
            O sistema operacional{" "}
            <span style={{ color: "var(--brand-600)" }}>para negócios pet</span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: "18px", color: "var(--app-text-muted)", lineHeight: 1.6, maxWidth: "520px", margin: "0 auto 36px" }}>
            Clientes, pets, agenda e financeiro numa só plataforma. Do pet shop à clínica veterinária.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginBottom: "56px" }}>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "48px", padding: "0 28px", fontSize: "15px", fontWeight: 700, color: "white", background: "var(--brand-600)", borderRadius: "10px", textDecoration: "none", boxShadow: "0 2px 10px rgba(45,106,79,0.3)" }}>
              Começar gratuitamente <ArrowRight size={16} />
            </Link>
            <Link href="#features" style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "48px", padding: "0 24px", fontSize: "15px", fontWeight: 500, color: "var(--app-text)", background: "var(--background)", borderRadius: "10px", textDecoration: "none", border: "1.5px solid var(--border)" }}>
              Ver funcionalidades <ChevronRight size={15} />
            </Link>
          </div>

          {/* Dashboard mock — compact screenshot */}
          <div style={{ maxWidth: "860px", margin: "0 auto", borderRadius: "16px 16px 0 0", overflow: "hidden", border: "1px solid var(--border)", borderBottom: "none", boxShadow: "0 -4px 40px rgba(0,0,0,0.10), 0 0 0 1px var(--border)" }}>
            {/* Window chrome */}
            <div style={{ background: "var(--gray-100)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#ef4444", display: "block" }} />
              <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#f59e0b", display: "block" }} />
              <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#22c55e", display: "block" }} />
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ width: "160px", height: "20px", borderRadius: "6px", background: "var(--gray-200)" }} />
              </div>
            </div>

            {/* App layout */}
            <div style={{ display: "flex", height: "280px", background: "var(--background)" }}>
              {/* Sidebar */}
              <div style={{ width: "160px", flexShrink: 0, background: "var(--brand-600)", padding: "16px 10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 8px 12px", borderBottom: "1px solid rgba(255,255,255,0.12)", marginBottom: "8px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <PawPrint size={11} color="white" />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "white" }}>PetBiz</span>
                </div>
                {[
                  { icon: LayoutDashboard, label: "Dashboard", active: true },
                  { icon: Users, label: "Clientes", active: false },
                  { icon: Calendar, label: "Agenda", active: false },
                  { icon: TrendingUp, label: "Financeiro", active: false },
                  { icon: Package, label: "Catálogo", active: false },
                ].map(({ icon: Icon, label, active }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 8px", borderRadius: "7px", background: active ? "rgba(255,255,255,0.18)" : "transparent" }}>
                    <Icon size={13} color={active ? "white" : "rgba(255,255,255,0.6)"} />
                    <span style={{ fontSize: "12px", fontWeight: active ? 600 : 400, color: active ? "white" : "rgba(255,255,255,0.6)" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div style={{ flex: 1, padding: "18px 20px", overflow: "hidden" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)", marginBottom: "14px" }}>Bom dia, Ana 👋</div>

                {/* KPI grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "14px" }}>
                  {[
                    { label: "Consultas hoje", value: "8", delta: "+2" },
                    { label: "Clientes", value: "142", delta: "+5" },
                    { label: "Pets", value: "289", delta: "+12" },
                    { label: "Receita mês", value: "€3.840", delta: "+18%" },
                  ].map((kpi) => (
                    <div key={kpi.label} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 12px" }}>
                      <div style={{ fontSize: "10px", color: "var(--app-text-muted)", marginBottom: "3px" }}>{kpi.label}</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--app-text)" }}>{kpi.value}</div>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--brand-500)", marginTop: "2px" }}>{kpi.delta}</div>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 14px", height: "130px", display: "flex", alignItems: "flex-end", gap: "5px" }}>
                  {[35, 55, 40, 75, 50, 85, 62, 90, 55, 80, 68, 95].map((h, i) => (
                    <div key={i} style={{ flex: 1, borderRadius: "3px 3px 0 0", background: i === 11 ? "var(--brand-600)" : "var(--brand-200)", height: `${h}%`, transition: "height 0.3s ease" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ──────────────────────────────────── */}
      <section style={{ background: "var(--gray-50)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
          <p style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--app-text-muted)", marginBottom: "28px" }}>
            Usado por todos os tipos de negócio pet
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap" }}>
            {[
              { icon: Store, label: "Pet Shop" },
              { icon: Scissors, label: "Grooming" },
              { icon: Stethoscope, label: "Clínica Vet" },
              { icon: House, label: "Hotel Pet" },
              { icon: UserRound, label: "Pet Sitter" },
              { icon: Dumbbell, label: "Treino" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--brand-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} style={{ color: "var(--brand-700)" }} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--app-text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" style={{ background: "var(--background)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand-600)", marginBottom: "10px" }}>Funcionalidades</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--app-text)", lineHeight: 1.2 }}>
              Tudo o que precisas para gerir<br />o teu negócio pet
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {[
              { icon: Shield, title: "Ficha completa por pet", desc: "Histórico médico, vacinas, alergias e observações por animal. Partilhável com o dono em qualquer momento." },
              { icon: Calendar, title: "Agenda com link partilhável", desc: "Os clientes marcam online através do teu link personalizado. Sem chamadas, sem confusões." },
              { icon: TrendingUp, title: "Dashboard financeiro", desc: "Receitas, despesas e lucro em tempo real. Relatórios mensais automáticos com comparação de períodos." },
              { icon: Package, title: "Gestão de stock e catálogo", desc: "Controla produtos, serviços e inventário. Alertas automáticos quando o stock está a esgotar." },
              { icon: BookOpen, title: "Biblioteca de recursos", desc: "Templates de cuidados, formulários de consentimento e guias para partilhar com os clientes." },
              { icon: Zap, title: "Onboarding em 5 minutos", desc: "Assistente guiado de configuração inicial. Do zero ao negócio operacional em menos de 5 minutos." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", boxShadow: "var(--card-shadow)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--brand-50)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                  <Icon size={20} style={{ color: "var(--brand-600)" }} />
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--app-text)", marginBottom: "6px" }}>{title}</h3>
                <p style={{ fontSize: "13px", color: "var(--app-text-muted)", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────── */}
      <section id="pricing" style={{ background: "var(--gray-50)", borderTop: "1px solid var(--border)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand-600)", marginBottom: "10px" }}>Preços</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--app-text)", lineHeight: 1.2, marginBottom: "12px" }}>
              Planos para cada fase do negócio
            </h2>
            <p style={{ fontSize: "16px", color: "var(--app-text-muted)" }}>Começa gratuitamente. Actualiza quando precisares.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "16px", alignItems: "start" }}>
            {[
              {
                name: "Gratuito", price: "€0", period: "para sempre", highlight: false, badge: null,
                features: ["1 utilizador", "Até 30 clientes", "Agenda básica", "Fichas de pets", "Suporte por email"],
                cta: "Começar grátis",
              },
              {
                name: "Starter", price: "€19", period: "/mês", highlight: false, badge: null,
                features: ["2 utilizadores", "Até 200 clientes", "Agenda partilhável", "Dashboard financeiro", "Catálogo", "Suporte prioritário"],
                cta: "Experimentar",
              },
              {
                name: "Pro", price: "€49", period: "/mês", highlight: true, badge: "Mais popular",
                features: ["5 utilizadores", "Clientes ilimitados", "Tudo do Starter", "Relatórios avançados", "Biblioteca recursos", "Integrações", "Suporte dedicado"],
                cta: "Experimentar",
              },
              {
                name: "Equipa", price: "€99", period: "/mês", highlight: false, badge: null,
                features: ["Utilizadores ilimitados", "Multi-localização", "Tudo do Pro", "RBAC avançado", "API access", "Onboarding personalizado"],
                cta: "Falar com vendas",
              },
            ].map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight ? "var(--brand-600)" : "var(--card-bg)",
                  border: plan.highlight ? "2px solid var(--brand-500)" : "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "24px",
                  position: "relative",
                  boxShadow: plan.highlight ? "0 8px 30px rgba(45,106,79,0.25)" : "var(--card-shadow)",
                }}
              >
                {plan.badge && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "var(--brand-400)", color: "white", borderRadius: "100px", padding: "3px 12px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: plan.highlight ? "rgba(255,255,255,0.75)" : "var(--app-text-muted)", marginBottom: "8px" }}>{plan.name}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "32px", fontWeight: 800, color: plan.highlight ? "white" : "var(--app-text)" }}>{plan.price}</span>
                    <span style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.6)" : "var(--app-text-muted)" }}>{plan.period}</span>
                  </div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px" }}>
                      <Check size={14} style={{ color: plan.highlight ? "var(--brand-200)" : "var(--brand-500)", flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ color: plan.highlight ? "rgba(255,255,255,0.85)" : "var(--app-text-muted)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", height: "40px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none",
                    background: plan.highlight ? "white" : "var(--brand-600)",
                    color: plan.highlight ? "var(--brand-700)" : "white",
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ──────────────────────────────────── */}
      <section style={{ background: "var(--brand-700)", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <PawPrint size={24} color="white" />
          </div>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "white", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "14px" }}>
            Começa hoje, gratuitamente
          </h2>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.72)", marginBottom: "36px" }}>
            Sem cartão de crédito. Configuração em 5 minutos.
          </p>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "48px", padding: "0 32px", fontSize: "15px", fontWeight: 700, color: "var(--brand-700)", background: "white", borderRadius: "10px", textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
            Criar conta gratuita <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer style={{ background: "var(--background)", borderTop: "1px solid var(--border)", padding: "24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PawPrint size={13} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--app-text)" }}>PetBiz</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>
            © {new Date().getFullYear()} PetBiz. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
