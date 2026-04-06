import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ orgSlug: string; productId: string }>;
}

async function getOrg(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId } } },
  });
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, productId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId: org.id, deletedAt: null },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, productId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const { name, description, category, sku, barcode, price, costPrice, stock, minStock, unit, isActive } = body;

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(category !== undefined && { category: category || null }),
      ...(sku !== undefined && { sku: sku || null }),
      ...(barcode !== undefined && { barcode: barcode || null }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(costPrice !== undefined && { costPrice: costPrice ? parseFloat(costPrice) : null }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(minStock !== undefined && { minStock: parseInt(minStock) }),
      ...(unit !== undefined && { unit: unit || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entity: "Product",
    entityId: product.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { name: product.name },
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, productId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    action: "DELETE",
    entity: "Product",
    entityId: productId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
