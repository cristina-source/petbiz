import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";
import { SPECIES_LABELS } from "@/lib/utils";
import { MapPin, Phone, Clock } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const BUSINESS_TYPE_PT: Record<string, string> = {
  PET_SHOP: "Pet Shop",
  GROOMING: "Grooming",
  VET_CLINIC: "Clínica Veterinária",
  PET_HOTEL: "Hotel / Creche",
  PET_SITTER: "Pet Sitter",
  TRAINING: "Adestramento",
  DELIVERY: "Delivery",
  MULTI: "Negócio Misto",
};

export default async function BookingPage({ params }: PageProps) {
  const { slug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug, deletedAt: null },
    include: {
      services: { where: { deletedAt: null, isActive: true }, orderBy: { name: "asc" } },
      speciesServed: true,
    },
  });
  if (!org) notFound();

  const hours = org.openingHours as Record<string, { open: string | null; close: string | null }> | null;
  const monHours = hours?.mon;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9f6" }}>

      {/* Header */}
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: "16px" }}>🐾</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: "16px", color: "#1f1d18" }}>
              {org.businessName ?? org.name}
            </span>
          </div>
          {org.businessType && (
            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>
              {BUSINESS_TYPE_PT[org.businessType] ?? ""}
            </span>
          )}
        </div>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px", alignItems: "start" }}>

          {/* Left — Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Business card */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1f1d18", margin: "0 0 4px" }}>
                {org.businessName ?? org.name}
              </h1>
              {org.businessType && (
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 16px" }}>
                  {BUSINESS_TYPE_PT[org.businessType]}
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {org.city && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
                    <MapPin size={14} style={{ flexShrink: 0, color: "#9ca3af" }} />
                    {org.city}
                  </div>
                )}
                {org.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
                    <Phone size={14} style={{ flexShrink: 0, color: "#9ca3af" }} />
                    {org.phone}
                  </div>
                )}
                {monHours?.open && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
                    <Clock size={14} style={{ flexShrink: 0, color: "#9ca3af" }} />
                    {monHours.open}–{monHours.close} (seg–sex)
                  </div>
                )}
              </div>
            </div>

            {/* Services */}
            {org.services.length > 0 && (
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
                  Serviços disponíveis
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {org.services.map((s) => (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#1f1d18", margin: 0 }}>{s.name}</p>
                        {s.duration && (
                          <p style={{ fontSize: "11px", color: "#9ca3af", margin: "1px 0 0" }}>{s.duration} min</p>
                        )}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1d4ed8" }}>
                        €{s.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Species */}
            {org.speciesServed.length > 0 && (
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                  Animais aceites
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {org.speciesServed.map((s) => (
                    <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "100px", background: "#f0faf5", fontSize: "12px", fontWeight: 500, color: "#166534" }}>
                      {SPECIES_LABELS[s.species]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Form */}
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "28px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#1f1d18", margin: "0 0 4px" }}>
              Marcar consulta
            </h2>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 24px" }}>
              Preenche o formulário e receberás confirmação por email.
            </p>
            <BookingForm
              orgSlug={org.slug}
              services={org.services.map((s) => ({ id: s.id, name: s.name, price: s.price, duration: s.duration }))}
            />
          </div>
        </div>
      </main>

      <footer style={{ marginTop: "48px", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#9ca3af" }}>
          Powered by <strong style={{ color: "#1d4ed8" }}>PetBiz</strong> · Sistema de gestão para negócios pet
        </p>
      </footer>
    </div>
  );
}
