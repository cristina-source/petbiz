import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { SPECIES_EMOJI } from "@/lib/utils";
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { AppointmentStatusActions } from "@/components/agenda/appointment-status-actions";
import Link from "next/link";
import {
  startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, format, isSameDay,
} from "date-fns";
import { pt } from "date-fns/locale";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ date?: string; view?: string }>;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8h–20h

export default async function AgendaPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;
  const { date: dateParam, view } = await searchParams;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
  });
  if (!org) redirect("/onboarding");

  const baseDate = dateParam ? new Date(dateParam) : new Date();
  const isWeekView = view === "week";

  const dayStart = startOfDay(baseDate);
  const dayEnd = endOfDay(baseDate);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });

  const prevDay = addDays(baseDate, -1).toISOString().split("T")[0];
  const nextDay = addDays(baseDate, 1).toISOString().split("T")[0];
  const prevWeek = addDays(baseDate, -7).toISOString().split("T")[0];
  const nextWeek = addDays(baseDate, 7).toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];

  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId: org.id,
      deletedAt: null,
      date: isWeekView ? { gte: weekStart, lte: weekEnd } : { gte: dayStart, lte: dayEnd },
    },
    orderBy: { date: "asc" },
    include: { client: true, pet: true, service: true },
  });

  const pendingCount = await prisma.appointment.count({
    where: { organizationId: org.id, deletedAt: null, status: "PENDING" },
  });

  const baseDateStr = baseDate.toISOString().split("T")[0];
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dateLabel = isWeekView
    ? `${format(weekStart, "d MMM", { locale: pt })} – ${format(weekEnd, "d MMM yyyy", { locale: pt })}`
    : baseDate.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* [ITERATE v3] — Substituído header manual pelo Topbar padrão com orgSlug */}
      <Topbar
        title="Agenda"
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

      <main style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Pending alert */}
        {pendingCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              borderRadius: "10px",
              border: "1px solid #fde68a",
              background: "#fffbeb",
              padding: "11px 16px",
            }}
          >
            <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>
              <strong>{pendingCount} marcações</strong> aguardam confirmação.
            </p>
          </div>
        )}

        {/* Controls bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "8px 12px",
            boxShadow: "var(--card-shadow)",
          }}
        >
          {/* View toggle */}
          <div
            style={{
              display: "flex",
              background: "var(--gray-100)",
              borderRadius: "7px",
              padding: "3px",
              gap: "2px",
              marginRight: "4px",
            }}
          >
            <Link
              href={`/dashboard/${orgSlug}/agenda?date=${baseDateStr}`}
              style={{
                padding: "5px 14px",
                borderRadius: "5px",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                background: !isWeekView ? "var(--background)" : "transparent",
                color: !isWeekView ? "var(--app-text)" : "var(--app-text-muted)",
                boxShadow: !isWeekView ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Dia
            </Link>
            <Link
              href={`/dashboard/${orgSlug}/agenda?date=${baseDateStr}&view=week`}
              style={{
                padding: "5px 14px",
                borderRadius: "5px",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                background: isWeekView ? "var(--background)" : "transparent",
                color: isWeekView ? "var(--app-text)" : "var(--app-text-muted)",
                boxShadow: isWeekView ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Semana
            </Link>
          </div>

          {/* Prev */}
          <Link
            href={`/dashboard/${orgSlug}/agenda?date=${isWeekView ? prevWeek : prevDay}${isWeekView ? "&view=week" : ""}`}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "7px",
              border: "1px solid var(--border)",
              color: "var(--app-text-muted)",
              textDecoration: "none",
              background: "var(--background)",
            }}
          >
            <ChevronLeft size={16} />
          </Link>

          {/* Date label */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--app-text)",
                margin: 0,
                textTransform: "capitalize",
              }}
            >
              {dateLabel}
            </p>
          </div>

          {/* Next */}
          <Link
            href={`/dashboard/${orgSlug}/agenda?date=${isWeekView ? nextWeek : nextDay}${isWeekView ? "&view=week" : ""}`}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "7px",
              border: "1px solid var(--border)",
              color: "var(--app-text-muted)",
              textDecoration: "none",
              background: "var(--background)",
            }}
          >
            <ChevronRight size={16} />
          </Link>

          {/* Hoje button — only when not on today */}
          {baseDateStr !== todayStr && (
            <Link
              href={`/dashboard/${orgSlug}/agenda${isWeekView ? "?view=week" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                height: "32px",
                padding: "0 12px",
                borderRadius: "7px",
                border: "1px solid var(--border)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--app-text-muted)",
                textDecoration: "none",
                background: "var(--background)",
                marginLeft: "4px",
              }}
            >
              Hoje
            </Link>
          )}
        </div>

        {/* ── Day view ── */}
        {!isWeekView && (
          appointments.length === 0 ? (
            <div
              style={{
                background: "var(--card-bg)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "64px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "var(--brand-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}
              >
                <CalendarDays size={26} style={{ color: "var(--brand-500)" }} />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--app-text)", marginBottom: "6px" }}>
                Sem marcações para este dia
              </h3>
              <p style={{ fontSize: "13px", color: "var(--app-text-muted)", marginBottom: "22px" }}>
                Clica em &ldquo;Nova marcação&rdquo; para adicionar.
              </p>
              <Link
                href={`/dashboard/${orgSlug}/agenda/novo`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "38px",
                  padding: "0 18px",
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
            <div
              style={{
                background: "var(--card-bg)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                boxShadow: "var(--card-shadow)",
                overflow: "hidden",
              }}
            >
              {appointments.map((appt, idx) => (
                <div
                  key={appt.id}
                  className="list-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px 20px",
                    borderBottom: idx < appointments.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.1s ease",
                  }}
                >
                  {/* Time */}
                  <div style={{ flexShrink: 0, textAlign: "right", width: "52px" }}>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--app-text)", margin: "0 0 1px" }}>
                      {new Date(appt.date).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {appt.service?.duration && (
                      <p style={{ fontSize: "11px", color: "var(--app-text-muted)", margin: 0 }}>
                        {appt.service.duration}min
                      </p>
                    )}
                  </div>

                  {/* Colored bar */}
                  <div
                    style={{
                      width: "3px",
                      height: "44px",
                      borderRadius: "2px",
                      background: appt.service?.color ?? "var(--brand-400)",
                      flexShrink: 0,
                    }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", margin: "0 0 2px" }}>
                      {appt.pet?.name ?? "—"}
                      {appt.pet ? ` ${SPECIES_EMOJI[appt.pet.species] ?? ""}` : ""}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: 0 }}>
                      {appt.service?.name ?? "Serviço"} ·{" "}
                      <Link
                        href={`/dashboard/${orgSlug}/clientes/${appt.clientId}`}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {appt.client.name}
                      </Link>
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Link
                      href={`/dashboard/${orgSlug}/agenda/${appt.id}/editar`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "7px",
                        border: "1px solid var(--border)",
                        color: "var(--app-text-muted)",
                        textDecoration: "none",
                        background: "var(--background)",
                        flexShrink: 0,
                      }}
                    >
                      <Pencil size={14} />
                    </Link>
                    <AppointmentStatusActions
                      appointmentId={appt.id}
                      orgSlug={orgSlug}
                      currentStatus={appt.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Week view ── */}
        {isWeekView && (
          <div
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "var(--card-shadow)",
            }}
          >
            {/* Day headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "56px repeat(7, 1fr)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ borderRight: "1px solid var(--border)" }} />
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    style={{
                      padding: "10px 6px",
                      textAlign: "center",
                      borderRight: "1px solid var(--border)",
                      background: isToday ? "var(--brand-50)" : "transparent",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--app-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 2px",
                        fontWeight: 600,
                      }}
                    >
                      {format(day, "EEE", { locale: pt })}
                    </p>
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: isToday ? 800 : 500,
                        color: isToday ? "var(--brand-600)" : "var(--app-text)",
                        lineHeight: 1.2,
                        margin: 0,
                      }}
                    >
                      {format(day, "d")}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Hour grid */}
            <div style={{ overflowY: "auto", maxHeight: "560px" }}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px repeat(7, 1fr)",
                    borderBottom: "1px solid var(--border)",
                    minHeight: "56px",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 8px 0",
                      textAlign: "right",
                      borderRight: "1px solid var(--border)",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "var(--app-text-muted)" }}>
                      {String(hour).padStart(2, "0")}:00
                    </span>
                  </div>

                  {weekDays.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    const slotAppts = appointments.filter((a) => {
                      const d = new Date(a.date);
                      return isSameDay(d, day) && d.getHours() === hour;
                    });
                    return (
                      <div
                        key={day.toISOString()}
                        style={{
                          padding: "4px 3px",
                          borderRight: "1px solid var(--border)",
                          background: isToday ? "var(--brand-50)" : "transparent",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        {slotAppts.map((a) => (
                          <Link
                            key={a.id}
                            href={`/dashboard/${orgSlug}/agenda/${a.id}/editar`}
                            style={{
                              display: "block",
                              padding: "3px 5px",
                              borderRadius: "4px",
                              background: a.service?.color ?? "var(--brand-500)",
                              textDecoration: "none",
                              overflow: "hidden",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "white",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                margin: 0,
                              }}
                            >
                              {new Date(a.date).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}{" "}
                              {a.pet?.name ?? a.client.name}
                            </p>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>
          {appointments.length} marcação{appointments.length !== 1 ? "ões" : ""}{" "}
          {isWeekView ? "esta semana" : "hoje"}
        </p>
      </main>
    </div>
  );
}
