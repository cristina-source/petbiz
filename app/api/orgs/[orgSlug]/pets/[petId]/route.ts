import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import type { Species, Gender } from "@prisma/client";

interface RouteParams {
  params: Promise<{ orgSlug: string; petId: string }>;
}

async function getOrg(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId } } },
  });
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, petId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const pet = await prisma.pet.findFirst({
    where: { id: petId, organizationId: org.id, deletedAt: null },
    include: { client: { select: { id: true, name: true } } },
  });
  if (!pet) return NextResponse.json({ error: "Pet não encontrado" }, { status: 404 });

  return NextResponse.json(pet);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, petId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const pet = await prisma.pet.findFirst({
    where: { id: petId, organizationId: org.id, deletedAt: null },
  });
  if (!pet) return NextResponse.json({ error: "Pet não encontrado" }, { status: 404 });

  const body = await req.json();
  const {
    name, species, breed, color, weight, birthDate, gender, microchipNumber,
    isNeutered, healthConditions, allergies, medications, feedingNotes,
    behaviorNotes, vetName, vetPhone, vetClinic,
  } = body;

  const updated = await prisma.pet.update({
    where: { id: petId },
    data: {
      ...(name !== undefined && { name }),
      ...(species !== undefined && { species: species as Species }),
      breed: breed || null,
      color: color || null,
      weight: weight ? parseFloat(weight) : null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender ? (gender as Gender) : null,
      microchipNumber: microchipNumber || null,
      ...(isNeutered !== undefined && { isNeutered: !!isNeutered }),
      healthConditions: healthConditions || null,
      allergies: allergies || null,
      medications: medications || null,
      feedingNotes: feedingNotes || null,
      behaviorNotes: behaviorNotes || null,
      vetName: vetName || null,
      vetPhone: vetPhone || null,
      vetClinic: vetClinic || null,
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entity: "Pet",
    entityId: petId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { name: updated.name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { orgSlug, petId } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.pet.update({
    where: { id: petId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    action: "DELETE",
    entity: "Pet",
    entityId: petId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
