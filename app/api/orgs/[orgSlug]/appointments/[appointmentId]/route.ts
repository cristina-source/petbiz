import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import type { AppointmentStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ orgSlug: string; appointmentId: string }>;
}

async function getOrg(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId } } },
  });
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, appointmentId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, organizationId: org.id, deletedAt: null },
    include: { client: true, pet: true, service: true },
  });
  if (!appt) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

  return NextResponse.json(appt);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, appointmentId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, organizationId: org.id, deletedAt: null },
  });
  if (!appt) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

  const body = await req.json();
  const { status, notes, price, date, endDate, petId, serviceId } = body;

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      ...(status !== undefined && { status: status as AppointmentStatus }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(price !== undefined && { price: price ? parseFloat(String(price)) : null }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(endDate !== undefined && endDate && { endDate: new Date(endDate) }),
      ...(petId !== undefined && { petId: petId || null }),
      ...(serviceId !== undefined && { serviceId: serviceId || null }),
    },
    include: { client: true, pet: true, service: true },
  });

  await createAuditLog({
    action: "UPDATE",
    entity: "Appointment",
    entityId: appointmentId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { status },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, appointmentId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    action: "DELETE",
    entity: "Appointment",
    entityId: appointmentId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
