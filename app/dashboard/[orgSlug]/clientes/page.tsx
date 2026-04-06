import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { formatDate, SPECIES_EMOJI, SPECIES_LABELS } from "@/lib/utils";
import { Users, Plus, Search, X, Download } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string; species?: string; filter?: string; sort?: string; page?: string }>;
}

const SPECIES_OPTIONS = ["DOG", "CAT", "BIRD", "RODENT", "REPTILE", "FISH", "RABBIT", "EXOTIC", "OTHER"];

export default async function ClientesPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;
  const { q, species, filter, sort, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const perPage = 25;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
  });
  if (!org) redirect("/onboarding");

  const ago60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const whereClause = {
    organizationId: org.id,
    deletedAt: null,
    ...(q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(species ? { pets: { some: { species: species as never, deletedAt: null } } } : {}),
    ...(filter === "no-appointments" ? {
      appointments: { none: { date: { gte: ago60 }, deletedAt: null } },
    } : {}),
  };

  const [clients, totalCount] = await Promise.all([
    prisma.client.findMany({
      where: whereClause,
      orderBy: sort === "name" ? { name: "asc" } : sort === "name-desc" ? { name: "desc" } : sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        pets: { where: { deletedAt: null } },
        _count: { select: { appointments: true } },
      },
    }),
    prisma.client.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  const hasFilters = !!(q || species || filter);
  const base = `/dashboard/${orgSlug}/clientes`;

  function chipUrl(key: string, value: string | null) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (species) p.set("species", species);
    if (filter) p.set("filter", filter);
    if (sort) p.set("sort", sort);
    // Preserve page only for pagination; reset for filter/sort changes
    if (key === "page" && value) p.set("page", value);
    if (value === null) p.delete(key);
    else p.set(key, value);
    const str = p.toString();
    return `${base}${str ? `?${str}` : ""}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* [ITERATE v3] — Substituído header manual pelo Topbar padrão com orgSlug */}
      <Topbar
        title="Clientes"
        orgSlug={orgSlug}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href={`/api/orgs/${orgSlug}/clientes/export`}
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
              href={`${base}/novo`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                height: "36px", padding: "0 16px", borderRadius: "8px",
                background: "var(--brand-600)", color: "white",
                fontSize: "13px", fontWeight: 600, textDecoration: "none",
              }}
            >
              <Plus size={14} /> Novo cliente
            </Link>
          </div>
        }
      />

      <main style={{ flex: 1, padding: "20px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Search bar */}
        <form method="get" style={{ position: "relative", maxWidth: "440px" }}>
          {species && <input type="hidden" name="species" value={species} />}
          {filter && <input type="hidden" name="filter" value={filter} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
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
            placeholder="Pesquisar por nome, email ou telefone..."
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
            Filtrar:
          </span>

          <Link
            href={filter === "no-appointments" ? chipUrl("filter", null) : chipUrl("filter", "no-appointments")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              height: "28px",
              padding: "0 11px",
              borderRadius: "100px",
              fontSize: "12px",
              fontWeight: 500,
              textDecoration: "none",
              background: filter === "no-appointments" ? "var(--brand-600)" : "var(--gray-100)",
              color: filter === "no-appointments" ? "white" : "var(--app-text)",
              border: filter === "no-appointments" ? "1.5px solid var(--brand-600)" : "1.5px solid var(--border)",
              transition: "all 0.1s ease",
            }}
          >
            Sem visita 60+ dias
            {filter === "no-appointments" && <X size={11} />}
          </Link>

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
                transition: "all 0.1s ease",
              }}
            >
              {SPECIES_EMOJI[s]} {SPECIES_LABELS[s]}
              {species === s && <X size={11} />}
            </Link>
          ))}

          {hasFilters && (
            <Link
              href={base}
              style={{
                fontSize: "12px",
                color: "var(--brand-600)",
                textDecoration: "none",
                fontWeight: 500,
                marginLeft: "4px",
              }}
            >
              Limpar filtros
            </Link>
          )}
        </div>

        {/* Sort chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--app-text-muted)", fontWeight: 500, marginRight: "2px" }}>
            Ordenar:
          </span>
          {([
            { value: undefined, label: "Mais recentes" },
            { value: "name", label: "Nome A-Z" },
            { value: "name-desc", label: "Nome Z-A" },
            { value: "oldest", label: "Mais antigos" },
          ] as const).map((opt) => {
            const isActive = (sort ?? undefined) === opt.value;
            return (
              <Link
                key={opt.label}
                href={chipUrl("sort", opt.value ?? null)}
                style={{
                  height: "26px", padding: "0 10px", borderRadius: "100px",
                  fontSize: "11px", fontWeight: 500, textDecoration: "none",
                  display: "inline-flex", alignItems: "center",
                  background: isActive ? "var(--brand-600)" : "var(--gray-100)",
                  color: isActive ? "white" : "var(--app-text-muted)",
                  border: isActive ? "1px solid var(--brand-600)" : "1px solid var(--border)",
                }}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>

        {/* Client list */}
        {clients.length === 0 ? (
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
              <Users size={26} style={{ color: "var(--brand-500)" }} />
            </div>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--app-text)",
                marginBottom: "6px",
              }}
            >
              {hasFilters ? "Sem resultados para os filtros activos" : "Ainda sem clientes"}
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--app-text-muted)",
                marginBottom: "22px",
                maxWidth: "280px",
              }}
            >
              {hasFilters
                ? "Tenta ajustar ou limpar os filtros."
                : "Adiciona o primeiro cliente e começa a gerir o teu negócio."}
            </p>
            {!hasFilters && (
              <Link
                href={`${base}/novo`}
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
                <Plus size={14} /> Adicionar cliente
              </Link>
            )}
            {hasFilters && (
              <Link
                href={base}
                style={{ fontSize: "13px", color: "var(--brand-600)", textDecoration: "underline" }}
              >
                Limpar filtros
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
            {clients.map((client, idx) => (
              <Link
                key={client.id}
                href={`${base}/${client.id}`}
                className="client-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 20px",
                  textDecoration: "none",
                  borderBottom: idx < clients.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "var(--brand-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--brand-700)",
                    flexShrink: 0,
                  }}
                >
                  {client.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--app-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        margin: 0,
                      }}
                    >
                      {client.name}
                    </p>
                    {client.pets.length > 0 && (
                      <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                        {[...new Set(client.pets.map((p) => p.species))].map((s) => (
                          <span key={s} style={{ fontSize: "14px" }} title={SPECIES_LABELS[s]}>
                            {SPECIES_EMOJI[s] ?? "🐾"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
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
                    {client.email ?? client.phone ?? "—"}
                  </p>
                </div>

                {/* Meta */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "4px",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--app-text-muted)",
                      background: "var(--gray-100)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontWeight: 500,
                    }}
                  >
                    {formatDate(client.createdAt)}
                  </span>
                  <p style={{ fontSize: "11px", color: "var(--app-text-muted)", margin: 0 }}>
                    {client.pets.length} pet{client.pets.length !== 1 ? "s" : ""} ·{" "}
                    {client._count.appointments} marcaç{client._count.appointments !== 1 ? "ões" : "ão"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "var(--app-text-muted)" }}>
            {totalCount} cliente{totalCount !== 1 ? "s" : ""}
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
