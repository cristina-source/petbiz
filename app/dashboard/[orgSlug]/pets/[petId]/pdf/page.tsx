import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SPECIES_LABELS } from "@/lib/utils";
import { PrintButton } from "./print-button";

interface PageProps {
  params: Promise<{ orgSlug: string; petId: string }>;
}

export default async function PetPdfPage({ params }: PageProps) {
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
    },
  });
  if (!pet) notFound();

  const ageYears = pet.birthDate
    ? Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31557600000)
    : null;

  const GENDER_PT: Record<string, string> = { MALE: "Macho", FEMALE: "Fêmea" };

  const SPECIES_EMOJI: Record<string, string> = {
    DOG: "🐶", CAT: "🐱", BIRD: "🐦", RABBIT: "🐰",
    RODENT: "🐭", REPTILE: "🦎", FISH: "🐟", EXOTIC: "🦜",
  };

  const printedAt = new Date().toLocaleDateString("pt-PT", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // [ITERATE v3] — PDF: cores actualizadas para azul; print button extraído para client component
  return (
    <>
      <div className="no-print" style={{
        position: "fixed", top: "16px", right: "16px", zIndex: 100,
        display: "flex", gap: "8px",
      }}>
        <a
          href={`/dashboard/${orgSlug}/pets/${petId}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            height: "36px", padding: "0 14px", borderRadius: "8px",
            border: "1.5px solid #d1d5db", background: "white", color: "#374151",
            fontSize: "13px", fontWeight: 500, textDecoration: "none",
          }}
        >
          ← Voltar
        </a>
        <PrintButton />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          @page { margin: 20mm 18mm; size: A4; }
        }
        body { font-family: system-ui, -apple-system, sans-serif; background: #f4f3f0; }
      `}</style>

      <div style={{
        maxWidth: "700px", margin: "60px auto 40px", padding: "48px",
        background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        borderRadius: "12px",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", paddingBottom: "20px", borderBottom: "2px solid #1d4ed8" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontSize: "14px" }}>🐾</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: "16px", color: "#1f1d18" }}>PetBiz</span>
            </div>
            <p style={{ fontSize: "12px", color: "#6e6b63", margin: 0 }}>
              {org.businessName ?? org.name}
              {org.city ? ` · ${org.city}` : ""}
              {org.phone ? ` · ${org.phone}` : ""}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "11px", color: "#8c8880", margin: 0 }}>Ficha clínica gerada em</p>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#1f1d18", margin: 0 }}>{printedAt}</p>
          </div>
        </div>

        {/* Pet identity */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "28px" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "16px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", flexShrink: 0 }}>
            {SPECIES_EMOJI[pet.species] ?? "🐾"}
          </div>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#1f1d18", margin: "0 0 4px" }}>{pet.name}</h1>
            <p style={{ fontSize: "14px", color: "#6e6b63", margin: "0 0 8px" }}>
              {SPECIES_LABELS[pet.species]}
              {pet.breed ? ` · ${pet.breed}` : ""}
              {pet.color ? ` · ${pet.color}` : ""}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {pet.isNeutered && <span style={chipStyle("#dbeafe", "#1e40af")}>Castrado/a</span>}
              {pet.gender && <span style={chipStyle("#f3f4f6", "#374151")}>{GENDER_PT[pet.gender]}</span>}
              {ageYears !== null && <span style={chipStyle("#f3f4f6", "#374151")}>{ageYears} {ageYears === 1 ? "ano" : "anos"}</span>}
              {pet.weight && <span style={chipStyle("#f3f4f6", "#374151")}>{pet.weight} kg</span>}
            </div>
          </div>
        </div>

        {/* Two-column details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
          <Section title="Identificação">
            {pet.birthDate && <Row label="Data de nascimento" value={new Date(pet.birthDate).toLocaleDateString("pt-PT")} />}
            {pet.microchipNumber && <Row label="Microchip" value={pet.microchipNumber} mono />}
            {pet.weight && <Row label="Peso" value={`${pet.weight} kg`} />}
            {pet.color && <Row label="Pelagem / cor" value={pet.color} />}
            {!pet.birthDate && !pet.microchipNumber && !pet.weight && !pet.color && (
              <p style={emptyStyle}>Sem dados adicionais</p>
            )}
          </Section>

          <Section title="Tutor / Responsável">
            <Row label="Nome" value={pet.client.name} />
            {pet.client.email && <Row label="Email" value={pet.client.email} />}
            {pet.client.phone && <Row label="Telefone" value={pet.client.phone} />}
            {pet.client.address && <Row label="Morada" value={pet.client.address} />}
          </Section>
        </div>

        {/* Saúde */}
        {(pet.healthConditions || pet.allergies || pet.medications || pet.feedingNotes || pet.behaviorNotes) && (
          <div style={{ marginBottom: "28px" }}>
            <SectionTitle>Informação clínica</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {pet.healthConditions && <InfoBlock title="Condições de saúde" value={pet.healthConditions} color="#dbeafe" />}
              {pet.allergies && <InfoBlock title="Alergias" value={pet.allergies} color="#fef9c3" />}
              {pet.medications && <InfoBlock title="Medicação atual" value={pet.medications} color="#ede9fe" />}
              {pet.feedingNotes && <InfoBlock title="Alimentação" value={pet.feedingNotes} color="#f0fdf4" />}
              {pet.behaviorNotes && <InfoBlock title="Comportamento" value={pet.behaviorNotes} color="#faf5ff" />}
            </div>
          </div>
        )}

        {/* Veterinário */}
        {(pet.vetName || pet.vetClinic) && (
          <div style={{ marginBottom: "28px" }}>
            <SectionTitle>Veterinário habitual</SectionTitle>
            <div style={{ padding: "14px 16px", borderRadius: "8px", background: "#f8faff", border: "1px solid #bfdbfe" }}>
              {pet.vetName && <p style={{ fontSize: "14px", fontWeight: 600, color: "#1f1d18", margin: "0 0 2px" }}>{pet.vetName}</p>}
              {pet.vetClinic && <p style={{ fontSize: "13px", color: "#6e6b63", margin: "0 0 2px" }}>{pet.vetClinic}</p>}
              {pet.vetPhone && <p style={{ fontSize: "13px", color: "#6e6b63", margin: 0 }}>{pet.vetPhone}</p>}
            </div>
          </div>
        )}

        {/* Vacinas */}
        <div style={{ marginBottom: "16px" }}>
          <SectionTitle>Registo de vacinas</SectionTitle>
          {pet.vaccines.length === 0 ? (
            <p style={emptyStyle}>Sem vacinas registadas</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#eff6ff" }}>
                  <th style={thStyle}>Vacina</th>
                  <th style={thStyle}>Administrada</th>
                  <th style={thStyle}>Reforço</th>
                  <th style={thStyle}>Lote</th>
                </tr>
              </thead>
              <tbody>
                {pet.vaccines.map((v, i) => {
                  const overdue = v.nextDueDate && new Date(v.nextDueDate) < new Date();
                  return (
                    <tr key={v.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={tdStyle}>{v.name}</td>
                      <td style={tdStyle}>{new Date(v.date).toLocaleDateString("pt-PT")}</td>
                      <td style={{ ...tdStyle, color: overdue ? "#dc2626" : "#1e40af", fontWeight: v.nextDueDate ? 500 : 400 }}>
                        {v.nextDueDate ? new Date(v.nextDueDate).toLocaleDateString("pt-PT") : "—"}
                        {overdue ? " ⚠" : ""}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "11px" }}>{v.lotNumber ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>Documento gerado pelo PetBiz · petbiz.pt</p>
          <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{org.businessName ?? org.name}</p>
        </div>
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────

function chipStyle(bg: string, color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 600, background: bg, color };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>{title}</p>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>{children}</p>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "13px", marginBottom: "6px" }}>
      <span style={{ color: "#6b7280", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#1f1d18", textAlign: "right", fontFamily: mono ? "monospace" : "inherit", fontSize: mono ? "11px" : "13px" }}>{value}</span>
    </div>
  );
}

function InfoBlock({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: "8px", background: color, border: "1px solid rgba(0,0,0,0.06)" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>{title}</p>
      <p style={{ fontSize: "13px", color: "#1f1d18", margin: 0, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 700,
  color: "#374151", borderBottom: "1px solid #bfdbfe",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px", color: "#374151", borderBottom: "1px solid #f3f4f6",
};

const emptyStyle: React.CSSProperties = {
  fontSize: "13px", color: "#9ca3af", fontStyle: "italic", margin: 0,
};
