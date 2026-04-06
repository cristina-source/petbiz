import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import type { TransactionType, PaymentMethod, PaymentStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ orgSlug: string }>;
}

async function getOrg(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId } } },
  });
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId: org.id,
      deletedAt: null,
      ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
    },
    orderBy: { date: "desc" },
    include: { client: true },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const { type, amount, description, method, status, date, notes, clientId, appointmentId } = body;

  if (!type || !amount) {
    return NextResponse.json({ error: "Tipo e valor são obrigatórios" }, { status: 400 });
  }

  const tx = await prisma.transaction.create({
    data: {
      type: type as TransactionType,
      amount: parseFloat(amount),
      description: description || null,
      method: method as PaymentMethod || null,
      status: (status as PaymentStatus) ?? "PAID",
      date: date ? new Date(date) : new Date(),
      notes: notes || null,
      clientId: clientId || null,
      appointmentId: appointmentId || null,
      organizationId: org.id,
    },
  });

  await createAuditLog({
    action: "CREATE",
    entity: "Transaction",
    entityId: tx.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { type, amount },
  });

  return NextResponse.json(tx, { status: 201 });
}
