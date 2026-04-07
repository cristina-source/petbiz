import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate, SPECIES_EMOJI, APPOINTMENT_STATUS_LABELS } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueChart } from "@/components/shared/revenue-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import {
  Users, CalendarDays, DollarSign, PawPrint,
  AlertCircle, Clock, Syringe, UserX, TrendingUp, Link2, Plus, Activity,
} from "lucide-react";
import {
  startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subMonths, format, addDays, formatDistanceToNow,
} from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

const ACTION_PT: Record<string, string> = {
  CREATE: "Criou", UPDATE: "Actualizou", DELETE: "Eliminou",
  COMPLETE: "Concluiu", CANCEL: "Cancelou", CONFIRM: "Confirmou",
};
const ENTITY_PT: Record<string, string> = {
  Client: "cliente", Pet: "pet", Appointment: "marcação",
  Service: "serviço", Product: "produto", Transaction: "transacção",
  Organization: "organização", Vaccine: "vacina",
};

const STATUS_BAR_COLOR: Record<string, string> = {
  PENDING: "#f59e0b", CONFIRMED: "#3b82f6", IN_PROGRESS: "#8b5cf6",
  COMPLETED: "#10b981", CANCELLED: "#d1d5db", NO_SHOW: "#ef4444",
};

export default async function DashboardPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
    include: { subscription: true },
  });
  if (!org) redirect("/onboarding");

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const in30Days = addDays(now, 30);
  const ago60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const monthRanges = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, "MMM", { locale: pt }) };
  });

  const [
    totalClients,
    totalPets,
    todayAppointments,
    weekAppointments,
    pendingAppointments,
    monthIncome,
    recentClients,
    upcomingAppointments,
    expiringVaccines,
    clientsAtRisk,
    recentActivity,
    topServices,
    completedCount,
    cancelledCount,
    ...monthlyData
  ] = await Promise.all([
    prisma.client.count({ where: { organizationId: org.id, deletedAt: null } }),
    prisma.pet.count({ where: { organizationId: org.id, deletedAt: null } }),
    prisma.appointment.count({
      where: { organizationId: org.id, deletedAt: null, date: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) } },
    }),
    prisma.appointment.count({
      where: { organizationId: org.id, deletedAt: null, date: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.appointment.count({ where: { organizationId: org.id, deletedAt: null, status: "PENDING" } }),
    prisma.transaction.aggregate({
      where: { organizationId: org.id, deletedAt: null, type: "INCOME", status: "PAID", date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.client.findMany({
      where: { organizationId: org.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { pets: { where: { deletedAt: null }, take: 1 } },
    }),
    prisma.appointment.findMany({
      where: { organizationId: org.id, deletedAt: null, date: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } },
      orderBy: { date: "asc" },
      take: 8,
      include: { client: true, pet: true, service: true },
    }),
    prisma.pet.findMany({
      where: {
        organizationId: org.id,
        deletedAt: null,
        vaccines: { some: { nextDueDate: { gte: now, lte: in30Days } } },
      },
      include: {
        client: true,
        vaccines: { where: { nextDueDate: { gte: now, lte: in30Days } }, orderBy: { nextDueDate: "asc" } },
      },
      take: 5,
    }),
    prisma.client.findMany({
      where: {
        organizationId: org.id,
        deletedAt: null,
        appointments: {
          none: { date: { gte: ago60Days }, deletedAt: null },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { pets: { where: { deletedAt: null }, take: 1 } },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: { organizationId: org.id, deletedAt: null, serviceId: { not: null }, date: { gte: monthStart, lte: monthEnd } },
      _count: true,
      orderBy: { _count: { serviceId: "desc" } },
      take: 5,
    }),
    prisma.appointment.count({
      where: { organizationId: org.id, deletedAt: null, status: "COMPLETED", date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.appointment.count({
      where: { organizationId: org.id, deletedAt: null, status: { in: ["CANCELLED", "NO_SHOW"] }, date: { gte: monthStart, lte: monthEnd } },
    }),
    ...monthRanges.map((m) =>
      Promise.all([
        prisma.transaction.aggregate({
          where: { organizationId: org.id, deletedAt: null, type: "INCOME", status: "PAID", date: { gte: m.start, lte: m.end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { organizationId: org.id, deletedAt: null, type: "EXPENSE", date: { gte: m.start, lte: m.end } },
          _sum: { amount: true },
        }),
      ])
    ),
  ]);

  const monthIncomeValue = monthIncome._sum.amount ?? 0;

  // Top serviços — resolver nomes
  const topServiceIds = (topServices as { serviceId: string | null; _count: number }[])
    .filter((s) => s.serviceId)
    .map((s) => s.serviceId!);
  const serviceNames = topServiceIds.length > 0
    ? await prisma.service.findMany({ where: { id: { in: topServiceIds } }, select: { id: true, name: true, color: true } })
    : [];
  const serviceMap = Object.fromEntries(serviceNames.map((s) => [s.id, s]));
  const topServicesResolved = (topServices as { serviceId: string | null; _count: number }[])
    .filter((s) => s.serviceId && serviceMap[s.serviceId!])
    .map((s) => ({ name: serviceMap[s.serviceId!].name, color: serviceMap[s.serviceId!].color, count: s._count }));

  // Taxa de conclusão
  const totalMonthAppts = (completedCount as number) + (cancelledCount as number);
  const completionRate = totalMonthAppts > 0 ? Math.round(((completedCount as number) / totalMonthAppts) * 100) : null;

  type PetWithVaccines = typeof expiringVaccines[number];
  const flatExpiringVaccines = (expiringVaccines as PetWithVaccines[]).flatMap((pet) =>
    pet.vaccines.map((v) => ({ ...v, pet: { name: pet.name, species: pet.species, client: pet.client } }))
  ).sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime()).slice(0, 5);

  const chartData = monthRanges.map((m, i) => {
    const pair = monthlyData[i] as [{ _sum: { amount: number | null } }, { _sum: { amount: number | null } }];
    return {
      month: m.label.charAt(0).toUpperCase() + m.label.slice(1),
      receita: pair[0]._sum.amount ?? 0,
      despesas: pair[1]._sum.amount ?? 0,
    };
  });

  const userName = session.user.name?.split(" ")[0] ?? "Olá";
  const todayFormatted = now.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* [ITERATE v3] — Substituído header manual pelo Topbar padrão com orgSlug */}
      <Topbar
        orgSlug={orgSlug}
        actions={
          <Link
            href={`/dashboard/${orgSlug}/agenda/novo`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "36px",
              padding: "0 16px",
              borderRadius: "8px",
              background: "var(--brand-600)",
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Plus size={14} /> Nova marcação
          </Link>
        }
      />

      <main style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Greeting header */}
        <div className="stagger-1">
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--app-text)", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
            {now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite"}, {userName}!
          </h2>
          <p style={{ fontSize: "13px", color: "var(--app-text-muted)", margin: 0, textTransform: "capitalize" }}>
            {todayFormatted}
          </p>
        </div>

        {/* Alert: marcações pendentes */}
        {pendingAppointments > 0 && (
          <div
            className="stagger-1"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--status-pending, #fde68a)",
              background: "rgba(245,158,11,0.06)",
              padding: "12px 16px",
            }}
          >
            <AlertCircle size={16} style={{ color: "#d97706", flexShrink: 0 }} />
            <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>
              <strong>{pendingAppointments} marcações</strong> aguardam confirmação.{" "}
              <Link
                href={`/dashboard/${orgSlug}/agenda`}
                style={{ color: "#d97706", textDecoration: "underline", fontWeight: 600 }}
              >
                Ver agenda
              </Link>
            </p>
          </div>
        )}

        {/* KPI cards */}
        <div
          className="grid-4-cols stagger-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          <StatCard
            title="Agendamentos hoje"
            value={todayAppointments}
            change={`${weekAppointments} esta semana`}
            changeType="neutral"
            icon={CalendarDays}
            iconColor="var(--brand-600)"
          />
          <StatCard title="Clientes activos" value={totalClients} icon={Users} iconColor="#3b82f6" />
          <StatCard title="Pets registados" value={totalPets} icon={PawPrint} iconColor="#8b5cf6" />
          <StatCard
            title="Receita do mês"
            value={formatCurrency(monthIncomeValue)}
            icon={DollarSign}
            iconColor="#10b981"
          />
        </div>

        {/* Link de marcações públicas */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 18px",
            borderRadius: "10px",
            border: "1px solid var(--brand-200)",
            background: "var(--brand-50)",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "var(--brand-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Link2 size={16} style={{ color: "var(--brand-600)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)", margin: "0 0 2px" }}>
              Link de marcações online
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--app-text-muted)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              /booking/{orgSlug}
            </p>
          </div>
          <Link
            href={`/booking/${orgSlug}`}
            target="_blank"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              height: "32px",
              padding: "0 14px",
              borderRadius: "8px",
              background: "var(--brand-600)",
              color: "white",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Ver página
          </Link>
        </div>

        {/* Revenue chart */}
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 20px 14px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={16} style={{ color: "var(--brand-600)" }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)" }}>
                Receita vs Despesas — últimos 6 meses
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--app-text-muted)" }}>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "2px",
                    background: "var(--brand-500)",
                    display: "inline-block",
                  }}
                />
                Receita
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--app-text-muted)" }}>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "2px",
                    background: "var(--brand-200)",
                    display: "inline-block",
                  }}
                />
                Despesas
              </span>
            </div>
          </div>
          <div style={{ padding: "8px 0 0" }}>
            <RevenueChart data={chartData} />
          </div>
        </div>

        {/* Top serviços + taxa de conclusão */}
        {(topServicesResolved.length > 0 || completionRate !== null) && (
          <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Top serviços do mês */}
            {topServicesResolved.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top serviços do mês</CardTitle>
                </CardHeader>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {topServicesResolved.map((s, idx) => {
                    const maxCount = topServicesResolved[0]?.count ?? 1;
                    const pct = Math.round((s.count / maxCount) * 100);
                    return (
                      <div key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--app-text)" }}>{s.name}</span>
                          <span style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>{s.count} marcaç{s.count !== 1 ? "ões" : "ão"}</span>
                        </div>
                        <div style={{ height: "6px", borderRadius: "3px", background: "var(--gray-100)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: "3px", background: s.color || "var(--brand-600)", transition: "width 0.3s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
            {/* Taxa de conclusão */}
            {completionRate !== null && (
              <Card>
                <CardHeader>
                  <CardTitle>Taxa de conclusão</CardTitle>
                </CardHeader>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "8px 0" }}>
                  <div style={{
                    width: "80px", height: "80px", borderRadius: "50%",
                    background: `conic-gradient(${completionRate >= 80 ? "#10b981" : completionRate >= 50 ? "#f59e0b" : "#ef4444"} ${completionRate * 3.6}deg, var(--gray-100) 0deg)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: "60px", height: "60px", borderRadius: "50%", background: "var(--card-bg)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px", fontWeight: 700, color: "var(--app-text)",
                    }}>
                      {completionRate}%
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "13px", color: "var(--app-text)", margin: "0 0 2px" }}>
                      <strong>{completedCount as number}</strong> concluída{(completedCount as number) !== 1 ? "s" : ""}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: 0 }}>
                      {cancelledCount as number} cancelada{(cancelledCount as number) !== 1 ? "s" : ""} / não compareceu
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Bottom grid: appointments + widgets */}
        <div
          className="grid-2-cols stagger-3"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr minmax(280px, 340px)",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {/* Próximos agendamentos */}
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              boxShadow: "var(--card-shadow)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={15} style={{ color: "var(--app-text-muted)" }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)" }}>
                  Próximos agendamentos
                </span>
              </div>
              <Link
                href={`/dashboard/${orgSlug}/agenda`}
                style={{ fontSize: "13px", color: "var(--brand-600)", textDecoration: "none", fontWeight: 500 }}
              >
                Ver todos
              </Link>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--brand-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                  }}
                >
                  <Clock size={22} style={{ color: "var(--brand-500)" }} />
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--app-text)",
                    marginBottom: "6px",
                  }}
                >
                  Sem marcações próximas
                </p>
                <p style={{ fontSize: "13px", color: "var(--app-text-muted)", marginBottom: "20px" }}>
                  Agenda uma nova marcação para começar.
                </p>
                <Link
                  href={`/dashboard/${orgSlug}/agenda/novo`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "36px",
                    padding: "0 16px",
                    borderRadius: "8px",
                    background: "var(--brand-600)",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <Plus size={14} /> Nova marcação
                </Link>
              </div>
            ) : (
              <div>
                {upcomingAppointments.map((appt, idx) => (
                  <div
                    key={appt.id}
                    className="list-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 20px",
                      borderBottom:
                        idx < upcomingAppointments.length - 1 ? "1px solid var(--border)" : "none",
                      transition: "background 0.12s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "3px",
                        height: "40px",
                        borderRadius: "2px",
                        background: appt.service?.color ?? STATUS_BAR_COLOR[appt.status] ?? "var(--brand-400)",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--app-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: "2px",
                        }}
                      >
                        {appt.pet ? `${appt.pet.name} ${SPECIES_EMOJI[appt.pet.species] ?? ""}` : "—"}{" "}
                        · {appt.client.name}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: 0 }}>
                        {appt.service?.name ?? "Serviço"} ·{" "}
                        {formatDate(appt.date, {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge status={appt.status}>{APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column: vaccines + clients at risk + recent clients */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Vacinas a expirar */}
            <div
              style={{
                background: "var(--card-bg)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                boxShadow: "var(--card-shadow)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <Syringe size={14} style={{ color: "#d97706" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)" }}>
                  Vacinas a expirar (30 dias)
                </span>
              </div>
              {flatExpiringVaccines.length === 0 ? (
                <div style={{ padding: "20px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "var(--app-text-muted)", margin: 0 }}>Tudo em dia ✓</p>
                </div>
              ) : (
                <div>
                  {flatExpiringVaccines.map((v, idx) => {
                    const daysLeft = Math.ceil(
                      (new Date(v.nextDueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={v.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 16px",
                          borderBottom:
                            idx < flatExpiringVaccines.length - 1 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "#fffbeb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontSize: "16px",
                          }}
                        >
                          {SPECIES_EMOJI[v.pet.species] ?? "🐾"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "var(--app-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              margin: "0 0 1px",
                            }}
                          >
                            {v.pet.name} · {v.name}
                          </p>
                          <p style={{ fontSize: "11px", color: "var(--app-text-muted)", margin: 0 }}>
                            {v.pet.client?.name}
                          </p>
                        </div>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: daysLeft <= 7 ? "#dc2626" : "#d97706",
                            whiteSpace: "nowrap",
                            background: daysLeft <= 7 ? "#fef2f2" : "#fffbeb",
                            padding: "2px 7px",
                            borderRadius: "6px",
                          }}
                        >
                          {daysLeft}d
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Clientes em risco */}
            {clientsAtRisk.length > 0 && (
              <div
                style={{
                  background: "var(--card-bg)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--card-shadow)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <UserX size={14} style={{ color: "var(--app-text-muted)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)" }}>
                    Sem visita há 60+ dias
                  </span>
                </div>
                <div>
                  {clientsAtRisk.map((c, idx) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/${orgSlug}/clientes/${c.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 16px",
                        textDecoration: "none",
                        borderBottom:
                          idx < clientsAtRisk.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "var(--gray-100)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "var(--app-text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        {c.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--app-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            margin: "0 0 1px",
                          }}
                        >
                          {c.name}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--app-text-muted)", margin: 0 }}>
                          {c.pets[0]?.name ?? "Sem pets"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Clientes recentes */}
            <div
              style={{
                background: "var(--card-bg)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                boxShadow: "var(--card-shadow)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <Users size={14} style={{ color: "var(--app-text-muted)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)" }}>
                    Clientes recentes
                  </span>
                </div>
                <Link
                  href={`/dashboard/${orgSlug}/clientes`}
                  style={{ fontSize: "12px", color: "var(--brand-600)", textDecoration: "none", fontWeight: 500 }}
                >
                  Ver todos
                </Link>
              </div>
              {recentClients.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <p style={{ fontSize: "13px", color: "var(--app-text-muted)", margin: 0 }}>
                    Ainda sem clientes
                  </p>
                  <Link
                    href={`/dashboard/${orgSlug}/clientes/novo`}
                    style={{ fontSize: "12px", color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }}
                  >
                    + Adicionar primeiro cliente
                  </Link>
                </div>
              ) : (
                <div>
                  {recentClients.map((c, idx) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/${orgSlug}/clientes/${c.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 16px",
                        textDecoration: "none",
                        borderBottom:
                          idx < recentClients.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "var(--brand-100)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "var(--brand-700)",
                          flexShrink: 0,
                        }}
                      >
                        {c.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--app-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            margin: "0 0 1px",
                          }}
                        >
                          {c.name}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--app-text-muted)", margin: 0 }}>
                          {c.pets[0]?.name ?? "Sem pets"}
                        </p>
                      </div>
                      <span
                        style={{ fontSize: "11px", color: "var(--app-text-subtle)", whiteSpace: "nowrap" }}
                      >
                        {formatDate(c.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actividade recente */}
        {(recentActivity as { id: string; action: string; entity: string; entityId: string; metadata: Record<string, string> | null; createdAt: Date; user: { name: string | null } | null }[]).length > 0 && (
          <Card>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={15} style={{ color: "var(--brand-600)" }} />
                <CardTitle>Actividade recente</CardTitle>
              </div>
            </CardHeader>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {(recentActivity as { id: string; action: string; entity: string; entityId: string; metadata: Record<string, string> | null; createdAt: Date; user: { name: string | null } | null }[]).map((log, idx) => {
                const userName = log.user?.name?.split(" ")[0] ?? "Sistema";
                const action = ACTION_PT[log.action] ?? log.action;
                const entity = ENTITY_PT[log.entity] ?? log.entity;
                const metaName = log.metadata?.name ?? log.metadata?.title ?? "";
                return (
                  <div
                    key={log.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "12px",
                      padding: "10px 0",
                      borderBottom: idx < 9 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div style={{
                      width: "6px", height: "6px", borderRadius: "50%", marginTop: "6px", flexShrink: 0,
                      background: log.action === "CREATE" ? "var(--brand-600)" : log.action === "DELETE" ? "#ef4444" : "var(--gray-300)",
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", color: "var(--app-text)", margin: 0, lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600 }}>{userName}</span>
                        {" "}{action.toLowerCase()} {entity}
                        {metaName && <span style={{ fontWeight: 500 }}> &quot;{metaName}&quot;</span>}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                        {formatDistanceToNow(log.createdAt, { addSuffix: true, locale: pt })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
