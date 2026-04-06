import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Plus, Pencil, Download } from "lucide-react";
import Link from "next/link";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ period?: string; tipo?: string }>;
}

const TYPE_PT: Record<string, string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  REFUND: "Reembolso",
};

const PAYMENT_STATUS_PT: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Em atraso",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const METHOD_PT: Record<string, string> = {
  CASH: "Numerário",
  CARD: "Cartão",
  TRANSFER: "Transferência",
  MBWAY: "MB Way",
  MULTIBANCO: "Multibanco",
  OTHER: "Outro",
};

const PERIOD_OPTIONS = [
  { value: "month", label: "Este mês" },
  { value: "last3", label: "3 meses" },
  { value: "last6", label: "6 meses" },
  { value: "all", label: "Tudo" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "INCOME", label: "Receitas" },
  { value: "EXPENSE", label: "Despesas" },
  { value: "REFUND", label: "Reembolsos" },
];

function buildFilterHref(orgSlug: string, period: string, tipo: string, overrides: Record<string, string>) {
  const p = overrides.period ?? period;
  const t = overrides.tipo ?? tipo;
  const params = new URLSearchParams();
  if (p !== "month") params.set("period", p);
  if (t !== "all") params.set("tipo", t);
  const qs = params.toString();
  return `/dashboard/${orgSlug}/financeiro${qs ? `?${qs}` : ""}`;
}

export default async function FinanceiroPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;
  const { period = "month", tipo = "all" } = await searchParams;

  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
  });
  if (!org) redirect("/onboarding");

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // [ITERATE v3] — Filtro por período via searchParams
  let dateFilter: { gte?: Date; lte?: Date } | undefined;
  if (period === "month") {
    dateFilter = { gte: monthStart, lte: monthEnd };
  } else if (period === "last3") {
    dateFilter = { gte: startOfMonth(subMonths(now, 2)) };
  } else if (period === "last6") {
    dateFilter = { gte: startOfMonth(subMonths(now, 5)) };
  }

  const typeFilter = tipo !== "all" ? { type: tipo as "INCOME" | "EXPENSE" | "REFUND" } : {};

  const [allTransactions, monthStats, pendingCount] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        organizationId: org.id,
        deletedAt: null,
        ...(dateFilter ? { date: dateFilter } : {}),
        ...typeFilter,
      },
      orderBy: { date: "desc" },
      take: 100,
      include: { client: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: {
        organizationId: org.id,
        deletedAt: null,
        date: { gte: monthStart, lte: monthEnd },
        status: "PAID",
      },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { organizationId: org.id, deletedAt: null, status: "PENDING" },
    }),
  ]);

  const monthIncome = monthStats.find((s) => s.type === "INCOME")?._sum.amount ?? 0;
  const monthExpense = monthStats.find((s) => s.type === "EXPENSE")?._sum.amount ?? 0;
  const monthBalance = monthIncome - monthExpense;

  // Breakdown por método de pagamento (apenas INCOME pago)
  const methodBreakdown = allTransactions
    .filter((tx) => tx.type === "INCOME" && tx.status === "PAID")
    .reduce<Record<string, number>>((acc, tx) => {
      const m = tx.method ?? "OTHER";
      acc[m] = (acc[m] ?? 0) + tx.amount;
      return acc;
    }, {});
  const methodTotal = Object.values(methodBreakdown).reduce((a, b) => a + b, 0);
  const methodEntries = Object.entries(methodBreakdown).sort((a, b) => b[1] - a[1]);

  const chipBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", height: "30px", padding: "0 12px",
    borderRadius: "100px", fontSize: "13px", fontWeight: 500, textDecoration: "none",
    border: "1px solid var(--border)", whiteSpace: "nowrap" as const,
  };
  const chipActive: React.CSSProperties = {
    ...chipBase,
    background: "var(--brand-600)", color: "#ffffff", border: "1px solid var(--brand-600)",
  };
  const chipInactive: React.CSSProperties = {
    ...chipBase,
    background: "transparent", color: "var(--app-text-muted)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar
        title="Financeiro"
        orgSlug={orgSlug}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href={`/api/orgs/${orgSlug}/transactions/export`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                height: "36px", padding: "0 14px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--gray-50)",
                color: "var(--app-text-muted)", fontSize: "13px", fontWeight: 500,
                textDecoration: "none",
              }}
              title="Exportar CSV"
            >
              <Download size={14} /> Exportar
            </a>
            <Link
              href={`/dashboard/${orgSlug}/financeiro/nova`}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", borderRadius: "8px", background: "var(--brand-600)", color: "white", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}
            >
              <Plus size={15} /> Registar
            </Link>
          </div>
        }
      />

      <main style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* KPIs do mês (sempre mês actual) */}
        <div className="grid-4-cols" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <StatCard title="Receita do mês" value={formatCurrency(monthIncome)} icon={TrendingUp} iconColor="#10b981" />
          <StatCard title="Despesas do mês" value={formatCurrency(monthExpense)} icon={TrendingDown} iconColor="#ef4444" />
          <StatCard title="Saldo do mês" value={formatCurrency(monthBalance)} changeType={monthBalance >= 0 ? "up" : "down"} icon={DollarSign} iconColor={monthBalance >= 0 ? "#10b981" : "#ef4444"} />
          <StatCard title="Pendentes" value={pendingCount} change="a confirmar pagamento" changeType="neutral" icon={DollarSign} iconColor="#f59e0b" />
        </div>

        {/* Breakdown por método de pagamento */}
        {methodEntries.length > 0 && (
          <Card>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--app-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>
              Receita por método de pagamento
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {methodEntries.map(([method, amount]) => {
                const pct = methodTotal > 0 ? Math.round((amount / methodTotal) * 100) : 0;
                return (
                  <div key={method}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--app-text)" }}>
                        {METHOD_PT[method] ?? method}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--app-text-muted)" }}>
                        {formatCurrency(amount)} <span style={{ color: "var(--brand-600)", fontWeight: 600 }}>{pct}%</span>
                      </span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "3px", background: "var(--gray-100)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "var(--brand-500)", borderRadius: "3px", transition: "width 0.3s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Listagem */}
        <Card padding="none">
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>Transacções</h3>
              <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: 0 }}>{allTransactions.length} resultado{allTransactions.length !== 1 ? "s" : ""}</p>
            </div>

            {/* [ITERATE v3] — Filtros por período e tipo em chips horizontais */}
            <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                {PERIOD_OPTIONS.map((opt) => (
                  <Link key={opt.value} href={buildFilterHref(orgSlug, period, tipo, { period: opt.value })} style={period === opt.value ? chipActive : chipInactive}>
                    {opt.label}
                  </Link>
                ))}
              </div>
              <div style={{ width: "1px", height: "20px", background: "var(--border)", flexShrink: 0 }} />
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                {TYPE_OPTIONS.map((opt) => (
                  <Link key={opt.value} href={buildFilterHref(orgSlug, period, tipo, { tipo: opt.value })} style={tipo === opt.value ? chipActive : chipInactive}>
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {allTransactions.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--brand-50)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                <DollarSign size={26} style={{ color: "var(--brand-500)" }} />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--app-text)", marginBottom: "6px" }}>Sem transacções para este período</h3>
              <p style={{ fontSize: "13px", color: "var(--app-text-muted)", marginBottom: "18px", maxWidth: "280px" }}>
                Regista receitas e despesas para acompanhar a saúde financeira do negócio.
              </p>
              <Link
                href={`/dashboard/${orgSlug}/financeiro/nova`}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "38px", padding: "0 18px", borderRadius: "8px", background: "var(--brand-600)", color: "white", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
              >
                <Plus size={14} /> Registar transacção
              </Link>
            </div>
          ) : (
            <div>
              {allTransactions.map((tx) => {
                const iconBg = tx.type === "INCOME" ? "#ecfdf5" : tx.type === "EXPENSE" ? "#fef2f2" : "#eff6ff";
                const iconColor = tx.type === "INCOME" ? "#059669" : tx.type === "EXPENSE" ? "#ef4444" : "#3b82f6";
                const amountColor = tx.type === "INCOME" ? "#059669" : tx.type === "EXPENSE" ? "#dc2626" : "var(--app-text)";
                const amountPrefix = tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : "";
                return (
                  <div key={tx.id} className="list-row" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 24px", borderBottom: "1px solid var(--border)", transition: "background 0.1s ease" }}>
                    <div style={{ height: "36px", width: "36px", borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {tx.type === "INCOME" ? <TrendingUp size={16} style={{ color: iconColor }} /> : tx.type === "EXPENSE" ? <TrendingDown size={16} style={{ color: iconColor }} /> : <DollarSign size={16} style={{ color: iconColor }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tx.description ?? TYPE_PT[tx.type]}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                        {tx.client?.name ?? "—"}
                        {tx.method ? ` · ${METHOD_PT[tx.method] ?? tx.method}` : ""}
                        {" · "}
                        {formatDate(tx.date)}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: amountColor }}>
                        {amountPrefix}{formatCurrency(tx.amount)}
                      </span>
                      <Badge status={tx.status}>{PAYMENT_STATUS_PT[tx.status] ?? tx.status}</Badge>
                      <Link
                        href={`/dashboard/${orgSlug}/financeiro/${tx.id}/editar`}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "7px", border: "1px solid var(--border)", color: "var(--app-text-muted)", textDecoration: "none", background: "var(--background)", flexShrink: 0 }}
                      >
                        <Pencil size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
