import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ orgSlug: string; serviceId: string }>;
}

async function getOrg(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId } } },
  });
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, serviceId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const service = await prisma.service.findFirst({
    where: { id: serviceId, organizationId: org.id, deletedAt: null },
  });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, serviceId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const { name, description, category, duration, price, color, isActive } = body;

  const service = await prisma.service.update({
    where: { id: serviceId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(category !== undefined && { category: category || null }),
      ...(duration !== undefined && { duration: parseInt(duration) }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(color !== undefined && { color: color || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entity: "Service",
    entityId: service.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { name: service.name },
  });

  return NextResponse.json(service);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, serviceId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.service.update({
    where: { id: serviceId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    action: "DELETE",
    entity: "Service",
    entityId: serviceId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
