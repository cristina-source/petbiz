import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, SPECIES_EMOJI, SPECIES_LABELS } from "@/lib/utils";
import { Phone, Syringe, Heart, AlertTriangle, Pill, Utensils, FileText, Plus, CalendarDays, Pencil } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";

interface PageProps {
  params: Promise<{ orgSlug: string; petId: string }>;
}

export default async function PetPage({ params }: PageProps) {
  const { orgSlug, petId } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
  });
  if (!org) redirect("/onboarding");

  const pet = await prisma.pet.findFirst({
    where: { id: petId, organizationId: org.id, deletedAt: null },
    include: {
      client: true,
      vaccines: { orderBy: { date: "desc" } },
      appointments: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        take: 10,
        include: { service: true },
      },
    },
  });

  if (!pet) notFound();

  const ageYears = pet.birthDate
    ? Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31557600000)
    : null;

  const upcomingVaccines = pet.vaccines.filter(
    (v) => v.nextDueDate && new Date(v.nextDueDate) > new Date()
  );

  const APPT_STATUS_PT: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  };

  const GENDER_PT: Record<string, string> = {
    MALE: "Macho",
    FEMALE: "Fêmea",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar
        title={pet.name}
        orgSlug={orgSlug}
        actions={
          <div style={{ display: "flex", gap: "8px" }}>
            <Link
              href={`/dashboard/${orgSlug}/pets/${petId}/pdf`}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 12px", borderRadius: "8px", border: "1.5px solid var(--border)", background: "transparent", color: "var(--app-text-muted)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
            >
              <FileText size={13} /> Exportar PDF
            </Link>
            <Link
              href={`/dashboard/${orgSlug}/pets/${petId}/editar`}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 12px", borderRadius: "8px", border: "1.5px solid var(--border)", background: "transparent", color: "var(--app-text)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
            >
              Editar ficha
            </Link>
          </div>
        }
      />
      <main style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <Breadcrumbs items={[
          { label: "Clientes", href: `/dashboard/${orgSlug}/clientes` },
          { label: pet.client.name, href: `/dashboard/${orgSlug}/clientes/${pet.clientId}` },
          { label: pet.name },
        ]} />

        {/* [ITERATE v1] — Convertido de Tailwind grid para inline styles; fix overflow no lado direito */}
        <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px", alignItems: "start" }}>
          {/* Coluna esquerda — identidade do pet */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ height: "64px", width: "64px", borderRadius: "16px", background: "var(--brand-50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>
                  {SPECIES_EMOJI[pet.species] ?? "🐾"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--app-text)", margin: 0 }}>{pet.name}</h2>
                  <p style={{ fontSize: "13px", color: "var(--app-text-muted)", margin: "2px 0 6px" }}>
                    {SPECIES_LABELS[pet.species]}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {pet.isNeutered && <Badge variant="info">Castrado/a</Badge>}
                    {pet.gender && <Badge variant="default">{GENDER_PT[pet.gender]}</Badge>}
                  </div>
                </div>
              </div>

              <dl style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                {ageYears !== null && (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <dt style={{ color: "var(--app-text-muted)" }}>Idade</dt>
                    <dd style={{ fontWeight: 500, color: "var(--app-text)", margin: 0, textAlign: "right" }}>
                      {ageYears} {ageYears === 1 ? "ano" : "anos"}
                      {pet.birthDate ? ` (${formatDate(pet.birthDate)})` : ""}
                    </dd>
                  </div>
                )}
                {pet.weight && (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <dt style={{ color: "var(--app-text-muted)" }}>Peso</dt>
                    <dd style={{ fontWeight: 500, color: "var(--app-text)", margin: 0 }}>{pet.weight} kg</dd>
                  </div>
                )}
                {pet.color && (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <dt style={{ color: "var(--app-text-muted)" }}>Cor</dt>
                    <dd style={{ fontWeight: 500, color: "var(--app-text)", margin: 0 }}>{pet.color}</dd>
                  </div>
                )}
                {pet.microchipNumber && (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <dt style={{ color: "var(--app-text-muted)" }}>Microchip</dt>
                    <dd style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--app-text)", margin: 0 }}>{pet.microchipNumber}</dd>
                  </div>
                )}
              </dl>

              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--app-text-muted)", marginBottom: "4px" }}>Tutor</p>
                <Link
                  href={`/dashboard/${orgSlug}/clientes/${pet.clientId}`}
                  style={{ fontSize: "14px", fontWeight: 500, color: "var(--brand-600)", textDecoration: "none" }}
                >
                  {pet.client.name}
                </Link>
                {pet.client.phone && (
                  <p style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--app-text-muted)", marginTop: "4px" }}>
                    <Phone size={11} />
                    {pet.client.phone}
                  </p>
                )}
              </div>
            </Card>

            {(pet.vetName || pet.vetClinic) && (
              <Card>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", marginBottom: "10px" }}>Veterinário habitual</p>
                {pet.vetName && <p style={{ fontSize: "14px", color: "var(--app-text)" }}>{pet.vetName}</p>}
                {pet.vetClinic && <p style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>{pet.vetClinic}</p>}
                {pet.vetPhone && (
                  <p style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--app-text-muted)", marginTop: "6px" }}>
                    <Phone size={11} />
                    {pet.vetPhone}
                  </p>
                )}
              </Card>
            )}
          </div>

          {/* Coluna direita — saúde, vacinas, histórico */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            {/* Saúde */}
            {(pet.healthConditions || pet.allergies || pet.medications || pet.feedingNotes) && (
              <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {pet.healthConditions && (
                  <Card>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <Heart size={15} style={{ color: "var(--brand-600)", flexShrink: 0 }} />
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)" }}>Condições de saúde</p>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--app-text)" }}>{pet.healthConditions}</p>
                  </Card>
                )}
                {pet.allergies && (
                  <Card>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <AlertTriangle size={15} style={{ color: "#f59e0b", flexShrink: 0 }} />
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)" }}>Alergias</p>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--app-text)" }}>{pet.allergies}</p>
                  </Card>
                )}
                {pet.medications && (
                  <Card>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <Pill size={15} style={{ color: "#3b82f6", flexShrink: 0 }} />
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)" }}>Medicação</p>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--app-text)" }}>{pet.medications}</p>
                  </Card>
                )}
                {pet.feedingNotes && (
                  <Card>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <Utensils size={15} style={{ color: "var(--brand-600)", flexShrink: 0 }} />
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--app-text)" }}>Alimentação</p>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--app-text)" }}>{pet.feedingNotes}</p>
                  </Card>
                )}
              </div>
            )}

            {/* Vacinas */}
            <Card padding="none">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Syringe size={15} style={{ color: "var(--brand-600)" }} />
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>Vacinas</h3>
                  {upcomingVaccines.length > 0 && (
                    <Badge variant="warning">{upcomingVaccines.length} a renovar</Badge>
                  )}
                </div>
                <Link
                  href={`/dashboard/${orgSlug}/pets/${petId}/vacinas/nova`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--brand-600)", textDecoration: "none", fontWeight: 500 }}
                >
                  <Plus size={13} />
                  Adicionar
                </Link>
              </div>
              {pet.vaccines.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" }}>
                  <Syringe size={24} style={{ margin: "0 auto 8px", color: "var(--app-text-subtle)" }} />
                  <p style={{ fontSize: "14px", color: "var(--app-text-muted)" }}>Sem vacinas registadas</p>
                </div>
              ) : (
                <div>
                  {pet.vaccines.map((vaccine) => {
                    const isDue = vaccine.nextDueDate && new Date(vaccine.nextDueDate) < new Date();
                    return (
                      <div key={vaccine.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)", margin: 0 }}>{vaccine.name}</p>
                          <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                            Administrada em {formatDate(vaccine.date)}
                            {vaccine.lotNumber ? ` · Lote: ${vaccine.lotNumber}` : ""}
                          </p>
                        </div>
                        {vaccine.nextDueDate && (
                          <Badge status={isDue ? "OVERDUE" : "CONFIRMED"}>
                            Reforço: {formatDate(vaccine.nextDueDate)}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Histórico de visitas */}
            <Card padding="none">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>Histórico de visitas</h3>
                <Link
                  href={`/dashboard/${orgSlug}/agenda/novo?clientId=${pet.clientId}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--brand-600)", textDecoration: "none", fontWeight: 500 }}
                >
                  <CalendarDays size={13} />
                  Agendar
                </Link>
              </div>
              {pet.appointments.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" }}>
                  <p style={{ fontSize: "14px", color: "var(--app-text-muted)" }}>Sem visitas registadas</p>
                </div>
              ) : (
                <div>
                  {pet.appointments.map((appt) => (
                    <div key={appt.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--app-text)", margin: 0 }}>
                          {appt.service?.name ?? "Serviço"}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                          {formatDate(appt.date, { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
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
