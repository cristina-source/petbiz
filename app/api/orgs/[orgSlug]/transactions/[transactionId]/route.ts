import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import type { TransactionType, PaymentMethod, PaymentStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ orgSlug: string; transactionId: string }>;
}

async function getOrg(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId } } },
  });
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, transactionId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, organizationId: org.id, deletedAt: null },
    include: { client: true },
  });
  if (!tx) return NextResponse.json({ error: "Transacção não encontrada" }, { status: 404 });

  return NextResponse.json(tx);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, transactionId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, organizationId: org.id, deletedAt: null },
  });
  if (!tx) return NextResponse.json({ error: "Transacção não encontrada" }, { status: 404 });

  const body = await req.json();
  const { type, amount, description, method, status, date, notes } = body;

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      ...(type !== undefined && { type: type as TransactionType }),
      ...(amount !== undefined && { amount: parseFloat(String(amount)) }),
      ...(description !== undefined && { description: description || null }),
      ...(method !== undefined && { method: method as PaymentMethod || null }),
      ...(status !== undefined && { status: status as PaymentStatus }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entity: "Transaction",
    entityId: transactionId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { type, amount },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, transactionId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    action: "DELETE",
    entity: "Transaction",
    entityId: transactionId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
