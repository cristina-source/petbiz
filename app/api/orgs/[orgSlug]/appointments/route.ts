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
  const clientId = searchParams.get("clientId");

  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId: org.id,
      deletedAt: null,
      ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
      ...(clientId ? { clientId } : {}),
    },
    orderBy: { date: "asc" },
    include: { client: true, pet: true, service: true },
  });

  return NextResponse.json(appointments);
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
  const { date, endDate, clientId, petId, serviceId, notes, price, title } = body;

  if (!date || !clientId) {
    return NextResponse.json({ error: "Data e cliente são obrigatórios" }, { status: 400 });
  }

  const apptDate = new Date(date);
  const apptEnd = endDate
    ? new Date(endDate)
    : new Date(apptDate.getTime() + 60 * 60 * 1000);

  const appointment = await prisma.appointment.create({
    data: {
      date: apptDate,
      endDate: apptEnd,
      clientId,
      petId: petId || null,
      serviceId: serviceId || null,
      notes: notes || null,
      price: price ? parseFloat(price) : null,
      title: title || null,
      status: "PENDING",
      organizationId: org.id,
    },
    include: { client: true, pet: true, service: true },
  });

  await createAuditLog({
    action: "CREATE",
    entity: "Appointment",
    entityId: appointment.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { date, clientId },
  });

  return NextResponse.json(appointment, { status: 201 });
}
