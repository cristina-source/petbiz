import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ orgSlug: string }>;
}

async function getOrg(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId } } },
  });
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const products = await prisma.product.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const { name, description, category, sku, barcode, price, costPrice, stock, minStock, unit } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: "Nome e preço são obrigatórios" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description || null,
      category: category || null,
      sku: sku || null,
      barcode: barcode || null,
      price: parseFloat(price),
      costPrice: costPrice ? parseFloat(costPrice) : null,
      stock: stock ? parseInt(stock) : 0,
      minStock: minStock ? parseInt(minStock) : 5,
      unit: unit || null,
      organizationId: org.id,
    },
  });

  await createAuditLog({
    action: "CREATE",
    entity: "Product",
    entityId: product.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { name },
  });

  return NextResponse.json(product, { status: 201 });
}
