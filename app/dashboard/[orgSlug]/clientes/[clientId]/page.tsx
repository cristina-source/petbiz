// [ITERATE v2] — Convertido de Tailwind para inline styles (fix layout e overflow, parity com pet detail)
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatCurrency, SPECIES_EMOJI, SPECIES_LABELS } from "@/lib/utils";
import { Phone, Mail, MapPin, Plus, PawPrint, CalendarDays, Pencil } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";

interface PageProps {
  params: Promise<{ orgSlug: string; clientId: string }>;
}

export default async function ClientePage({ params }: PageProps) {
  const { orgSlug, clientId } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
  });
  if (!org) redirect("/onboarding");

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: org.id, deletedAt: null },
    include: {
      pets: { where: { deletedAt: null }, include: { vaccines: { orderBy: { date: "desc" } } } },
      appointments: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        take: 10,
        include: { service: true, pet: true },
      },
      transactions: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        take: 5,
      },
    },
  });

  if (!client) notFound();

  const totalSpent = client.transactions
    .filter((t) => t.type === "INCOME" && t.status === "PAID")
    .reduce((sum, t) => sum + t.amount, 0);

  const APPT_STATUS_PT: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmado",
    IN_PROGRESS: "Em curso",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
    NO_SHOW: "Não compareceu",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar
        title={client.name}
        orgSlug={orgSlug}
        actions={
          <Link
            href={`/dashboard/${orgSlug}/clientes/${clientId}/editar`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 12px", borderRadius: "8px", border: "1.5px solid var(--border)", background: "transparent", color: "var(--app-text)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
          >
            Editar
          </Link>
        }
      />
      <main style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <Breadcrumbs items={[
          { label: "Clientes", href: `/dashboard/${orgSlug}/clientes` },
          { label: client.name },
        ]} />

        <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px", alignItems: "start" }}>
          {/* Coluna esquerda — ficha do cliente + pets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card>
              {/* Avatar + nome */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{ height: "52px", width: "52px", borderRadius: "50%", background: "var(--brand-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: "var(--brand-700)", flexShrink: 0 }}>
                  {client.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--app-text)", margin: 0 }}>{client.name}</h2>
                  <p style={{ fontSize: "12px", color: "var(--app-text-muted)", marginTop: "2px" }}>
                    Cliente desde {formatDate(client.createdAt)}
                  </p>
                </div>
              </div>

              {/* Contactos */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {client.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--app-text-muted)" }}>
                    <Mail size={14} style={{ flexShrink: 0 }} />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--app-text-muted)" }}>
                    <Phone size={14} style={{ flexShrink: 0 }} />
                    <span>{client.phone}</span>
                  </div>
                )}
                {(client.address || client.city) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--app-text-muted)" }}>
                    <MapPin size={14} style={{ flexShrink: 0 }} />
                    <span>{[client.address, client.city].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>

              {client.notes && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "12px", color: "var(--app-text-muted)", fontWeight: 500, marginBottom: "4px" }}>Notas</p>
                  <p style={{ fontSize: "14px", color: "var(--app-text)" }}>{client.notes}</p>
                </div>
              )}

              {/* Stats */}
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", textAlign: "center" }}>
                <div>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--app-text)" }}>{client.pets.length}</p>
                  <p style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>Pets</p>
                </div>
                <div>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--brand-600)" }}>{formatCurrency(totalSpent)}</p>
                  <p style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>Total gasto</p>
                </div>
              </div>
            </Card>

            {/* Pets */}
            <Card padding="none">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>Pets</h3>
                <Link
                  href={`/dashboard/${orgSlug}/pets/novo?clientId=${client.id}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--brand-600)", textDecoration: "none" }}
                >
                  <Plus size={13} />
                  Adicionar
                </Link>
              </div>
              {client.pets.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" }}>
                  <PawPrint size={24} style={{ margin: "0 auto 8px", color: "var(--app-text-subtle)" }} />
                  <p style={{ fontSize: "14px", color: "var(--app-text-muted)" }}>Sem pets registados</p>
                </div>
              ) : (
                <div>
                  {client.pets.map((pet) => (
                    <Link
                      key={pet.id}
                      href={`/dashboard/${orgSlug}/pets/${pet.id}`}
                      style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid var(--border)", textDecoration: "none" }}
                    >
                      <span style={{ fontSize: "20px" }}>{SPECIES_EMOJI[pet.species] ?? "🐾"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)", margin: 0 }}>{pet.name}</p>
                        <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                          {SPECIES_LABELS[pet.species]}
                          {pet.breed ? ` · ${pet.breed}` : ""}
                          {pet.birthDate
                            ? ` · ${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31557600000)} anos`
                            : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Coluna direita — histórico agendamentos */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            <Card padding="none">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>Histórico de agendamentos</h3>
                <Link
                  href={`/dashboard/${orgSlug}/agenda/novo?clientId=${client.id}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--brand-600)", textDecoration: "none" }}
                >
                  <CalendarDays size={13} />
                  Agendar
                </Link>
              </div>
              {client.appointments.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <CalendarDays size={24} style={{ margin: "0 auto 8px", color: "var(--app-text-subtle)" }} />
                  <p style={{ fontSize: "14px", color: "var(--app-text-muted)" }}>Sem agendamentos</p>
                </div>
              ) : (
                <div>
                  {client.appointments.map((appt) => (
                    <div key={appt.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)", margin: 0 }}>
                          {appt.service?.name ?? "Serviço"}
                          {appt.pet ? ` — ${appt.pet.name}` : ""}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                          {formatDate(appt.date, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        {appt.price && (
                          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)" }}>
                            {formatCurrency(appt.price)}
                          </span>
                        )}
                        <Badge status={appt.status}>
                          {APPT_STATUS_PT[appt.status] ?? appt.status}
                        </Badge>
                        <Link
                          href={`/dashboard/${orgSlug}/agenda/${appt.id}/editar`}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "6px", border: "1px solid var(--border)", color: "var(--app-text-muted)", textDecoration: "none", background: "var(--background)", flexShrink: 0 }}
                        >
                          <Pencil size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
