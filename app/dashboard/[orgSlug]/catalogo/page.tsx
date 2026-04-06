import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, Plus, AlertCircle, Package, Clock } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CatalogoPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;
  const { tab = "products" } = await searchParams;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
  });
  if (!org) redirect("/onboarding");

  const [products, services] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId: org.id, deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({
      where: { organizationId: org.id, deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock && p.isActive);
  const isProducts = tab === "products";

  return (
    // [ITERATE v3] — Convertido de Tailwind para inline styles
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Topbar
        title="Catálogo"
        orgSlug={orgSlug}
        actions={
          <Link
            href={`/dashboard/${orgSlug}/catalogo/${tab === "services" ? "servico" : "produto"}/novo`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", borderRadius: "8px", background: "var(--brand-600)", color: "white", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
          >
            <Plus size={15} />
            {tab === "services" ? "Novo serviço" : "Novo produto"}
          </Link>
        }
      />

      <main style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {lowStockProducts.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderRadius: "var(--radius)", border: "1px solid #fcd34d", background: "#fffbeb", padding: "12px 16px" }}>
            <AlertCircle size={18} style={{ color: "#d97706", flexShrink: 0 }} />
            <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>
              <strong>{lowStockProducts.length} produto{lowStockProducts.length !== 1 ? "s" : ""}</strong> com stock baixo:{" "}
              {lowStockProducts.map((p) => p.name).join(", ")}.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--gray-100)", borderRadius: "var(--radius-sm)", width: "fit-content" }}>
          <Link
            href={`/dashboard/${orgSlug}/catalogo?tab=products`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "7px 16px", fontSize: "13px", fontWeight: 500, borderRadius: "var(--radius-sm)",
              textDecoration: "none", transition: "all 0.12s ease",
              background: isProducts ? "var(--card-bg)" : "transparent",
              color: isProducts ? "var(--app-text)" : "var(--app-text-muted)",
              boxShadow: isProducts ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Package size={14} />
            Produtos ({products.length})
          </Link>
          <Link
            href={`/dashboard/${orgSlug}/catalogo?tab=services`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "7px 16px", fontSize: "13px", fontWeight: 500, borderRadius: "var(--radius-sm)",
              textDecoration: "none", transition: "all 0.12s ease",
              background: !isProducts ? "var(--card-bg)" : "transparent",
              color: !isProducts ? "var(--app-text)" : "var(--app-text-muted)",
              boxShadow: !isProducts ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Clock size={14} />
            Serviços ({services.length})
          </Link>
        </div>

        {/* Produtos */}
        {isProducts && (
          <Card padding="none">
            {products.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--brand-50)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <Package size={24} style={{ color: "var(--brand-500)" }} />
                </div>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: "0 0 6px" }}>Sem produtos no catálogo</p>
                <p style={{ fontSize: "13px", color: "var(--app-text-muted)", margin: "0 0 20px", maxWidth: "280px" }}>
                  Adiciona os primeiros produtos para começar a gerir o teu stock.
                </p>
                <Link
                  href={`/dashboard/${orgSlug}/catalogo/produto/novo`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", borderRadius: "8px", background: "var(--brand-600)", color: "white", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
                >
                  <Plus size={15} /> Adicionar produto
                </Link>
              </div>
            ) : (
              <div>
                {products.map((product) => {
                  const stockLow = product.stock <= product.minStock;
                  return (
                    <Link
                      key={product.id}
                      href={`/dashboard/${orgSlug}/catalogo/produto/${product.id}`}
                      className="client-row"
                      style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 24px", borderBottom: "1px solid var(--border)", textDecoration: "none" }}
                    >
                      <div style={{ height: "40px", width: "40px", borderRadius: "var(--radius-sm)", background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Package size={18} style={{ color: "var(--app-text-muted)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {product.name}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                          {product.category ?? "—"}
                          {product.sku ? ` · SKU: ${product.sku}` : ""}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>
                            {formatCurrency(product.price)}
                          </p>
                          {product.unit && (
                            <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: 0 }}>/{product.unit}</p>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: stockLow ? "#dc2626" : "var(--app-text)", margin: 0 }}>
                            {product.stock}
                          </p>
                          <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: 0 }}>em stock</p>
                        </div>
                        <Badge variant={product.isActive ? "success" : "default"}>
                          {product.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Serviços */}
        {!isProducts && (
          <Card padding="none">
            {services.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--brand-50)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <Clock size={24} style={{ color: "var(--brand-500)" }} />
                </div>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--app-text)", margin: "0 0 6px" }}>Sem serviços no catálogo</p>
                <p style={{ fontSize: "13px", color: "var(--app-text-muted)", margin: "0 0 20px", maxWidth: "280px" }}>
                  Adiciona os teus serviços para usar nos agendamentos.
                </p>
                <Link
                  href={`/dashboard/${orgSlug}/catalogo/servico/novo`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", borderRadius: "8px", background: "var(--brand-600)", color: "white", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
                >
                  <Plus size={15} /> Adicionar serviço
                </Link>
              </div>
            ) : (
              <div>
                {services.map((service) => (
                  <Link
                    key={service.id}
                    href={`/dashboard/${orgSlug}/catalogo/servico/${service.id}`}
                    className="client-row"
                    style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 24px", borderBottom: "1px solid var(--border)", textDecoration: "none" }}
                  >
                    <div
                      style={{
                        height: "40px", width: "40px", borderRadius: "var(--radius-sm)",
                        background: service.color ? `${service.color}25` : "var(--brand-50)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >
                      <Clock size={18} style={{ color: service.color ?? "var(--brand-600)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {service.name}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--app-text-muted)", margin: "2px 0 0" }}>
                        {service.category ?? "—"} · {service.duration} min
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>
                        {formatCurrency(service.price)}
                      </p>
                      <Badge variant={service.isActive ? "success" : "default"}>
                        {service.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
