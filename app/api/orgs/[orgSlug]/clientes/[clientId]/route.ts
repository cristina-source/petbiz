import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ orgSlug: string; clientId: string }>;
}

async function getOrg(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId } } },
  });
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, clientId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: org.id, deletedAt: null },
  });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  return NextResponse.json(client);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, clientId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: org.id, deletedAt: null },
  });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const body = await req.json();
  const { name, email, phone, taxId, address, city, notes } = body;

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      ...(name !== undefined && { name }),
      email: email || null,
      phone: phone || null,
      taxId: taxId || null,
      address: address || null,
      city: city || null,
      notes: notes || null,
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entity: "Client",
    entityId: clientId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { name: updated.name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, clientId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.client.update({
    where: { id: clientId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    action: "DELETE",
    entity: "Client",
    entityId: clientId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
