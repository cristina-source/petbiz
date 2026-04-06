import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { formatDate, SPECIES_EMOJI, SPECIES_LABELS } from "@/lib/utils";
import { PawPrint, Plus, Search, X } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string; species?: string; page?: string }>;
}

const SPECIES_OPTIONS = ["DOG", "CAT", "BIRD", "RODENT", "REPTILE", "FISH", "RABBIT", "EXOTIC", "OTHER"];

export default async function PetsPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;
  const { q, species, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const perPage = 25;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
  });
  if (!org) redirect("/onboarding");

  const whereClause = {
    organizationId: org.id,
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { breed: { contains: q, mode: "insensitive" as const } },
            { client: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(species ? { species: species as never } : {}),
  };

  const [pets, totalCount] = await Promise.all([
    prisma.pet.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        client: { select: { id: true, name: true } },
        vaccines: { select: { nextDueDate: true }, orderBy: { nextDueDate: "asc" }, take: 1 },
      },
    }),
    prisma.pet.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  const hasFilters = !!(q || species);
  const base = `/dashboard/${orgSlug}/pets`;

  function chipUrl(key: string, value: string | null) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (species) p.set("species", species);
    if (key === "page" && value) p.set("page", value);
    if (value === null) p.delete(key);
    else p.set(key, value);
    const str = p.toString();
    return `${base}${str ? `?${str}` : ""}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* [ITERATE v3] — Substituído header manual pelo Topbar padrão com orgSlug e botão Novo pet */}
      <Topbar
        title="Pets"
        orgSlug={orgSlug}
        actions={
          <Link
            href={`${base}/novo`}
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
            <Plus size={14} /> Novo pet
          </Link>
        }
      />

      <main style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Search bar */}
        <form method="get" style={{ position: "relative", maxWidth: "440px" }}>
          {species && <input type="hidden" name="species" value={species} />}
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--app-text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Pesquisar por nome, raça ou tutor..."
            style={{
              height: "40px",
              width: "100%",
              borderRadius: "10px",
              border: "1.5px solid var(--border)",
              background: "var(--input-bg)",
              paddingLeft: "36px",
              paddingRight: "12px",
              fontSize: "14px",
              color: "var(--app-text)",
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          />
        </form>

        {/* Filter chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--app-text-muted)", fontWeight: 500, marginRight: "2px" }}>
            Espécie:
          </span>
          {SPECIES_OPTIONS.map((s) => (
            <Link
              key={s}
              href={species === s ? chipUrl("species", null) : chipUrl("species", s)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                height: "28px",
                padding: "0 11px",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: 500,
                textDecoration: "none",
                background: species === s ? "var(--brand-600)" : "var(--gray-100)",
                color: species === s ? "white" : "var(--app-text)",
                border: species === s ? "1.5px solid var(--brand-600)" : "1.5px solid var(--border)",
              }}
            >
              {SPECIES_EMOJI[s]} {SPECIES_LABELS[s]}
              {species === s && <X size={11} />}
            </Link>
          ))}
          {hasFilters && (
            <Link
              href={base}
              style={{ fontSize: "12px", color: "var(--brand-600)", textDecoration: "none", fontWeight: 500, marginLeft: "4px" }}
            >
              Limpar filtros
            </Link>
          )}
        </div>

        {/* Pets list */}
        {pets.length === 0 ? (
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
              <PawPrint size={26} style={{ color: "var(--brand-500)" }} />
            </div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--app-text)", marginBottom: "6px" }}>
              {hasFilters ? "Sem resultados para os filtros activos" : "Ainda sem pets registados"}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--app-text-muted)", marginBottom: "22px", maxWidth: "280px" }}>
              {hasFilters
                ? "Tenta ajustar ou limpar os filtros."
                : "Os pets aparecem aqui quando são adicionados à ficha de um cliente."}
            </p>
            {hasFilters ? (
              <Link href={base} style={{ fontSize: "13px", color: "var(--brand-600)", textDecoration: "underline" }}>
                Limpar filtros
              </Link>
            ) : (
              <Link
                href={`${base}/novo`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  height: "38px", padding: "0 18px", borderRadius: "8px",
                  background: "var(--brand-600)", color: "white",
                  fontSize: "13px", fontWeight: 600, textDecoration: "none",
                }}
              >
                <Plus size={14} /> Registar pet
              </Link>
            )}
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
            {pets.map((pet, idx) => {
              const nextVaccine = pet.vaccines[0]?.nextDueDate;
              const vaccineOverdue = nextVaccine && new Date(nextVaccine) < new Date();
              const vaccineSoon =
                nextVaccine &&
                !vaccineOverdue &&
                new Date(nextVaccine) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              return (
                <Link
                  key={pet.id}
                  href={`/dashboard/${orgSlug}/pets/${pet.id}`}
                  className="client-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 20px",
                    textDecoration: "none",
                    borderBottom: idx < pets.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "var(--brand-50)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {SPECIES_EMOJI[pet.species] ?? "🐾"}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--app-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        margin: "0 0 2px",
                      }}
                    >
                      {pet.name}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--app-text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        margin: 0,
                      }}
                    >
                      {SPECIES_LABELS[pet.species]}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                      {" · "}
                      <span style={{ color: "var(--brand-600)" }}>{pet.client.name}</span>
                    </p>
                  </div>

                  {/* Meta */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                    {nextVaccine && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: vaccineOverdue
                            ? "#fee2e2"
                            : vaccineSoon
                            ? "#fef9c3"
                            : "var(--gray-100)",
                          color: vaccineOverdue ? "#dc2626" : vaccineSoon ? "#92400e" : "var(--app-text-muted)",
                          border: vaccineOverdue
                            ? "1px solid #fca5a5"
                            : vaccineSoon
                            ? "1px solid #fde68a"
                            : "1px solid var(--border)",
                        }}
                      >
                        {vaccineOverdue ? "Vacina em atraso" : `Reforço ${formatDate(nextVaccine)}`}
                      </span>
                    )}
                    <p style={{ fontSize: "11px", color: "var(--app-text-muted)", margin: 0 }}>
                      Desde {formatDate(pet.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>
            {totalCount} pet{totalCount !== 1 ? "s" : ""}
            {hasFilters ? " (com filtros activos)" : ""}
            {totalPages > 1 && ` · Página ${page} de ${totalPages}`}
          </p>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "6px" }}>
              {page > 1 && (
                <Link
                  href={chipUrl("page", String(page - 1))}
                  style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-600)", textDecoration: "none", padding: "4px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--gray-50)" }}
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={chipUrl("page", String(page + 1))}
                  style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-600)", textDecoration: "none", padding: "4px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--gray-50)" }}
                >
                  Seguinte →
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
