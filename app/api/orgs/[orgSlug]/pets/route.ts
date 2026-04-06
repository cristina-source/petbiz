import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import type { Species, Gender } from "@prisma/client";

interface RouteParams {
  params: Promise<{ orgSlug: string }>;
}

async function getOrg(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId } } },
  });
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
  const {
    name, species, breed, color, weight, birthDate, gender, microchipNumber,
    isNeutered, healthConditions, allergies, medications, feedingNotes,
    behaviorNotes, vetName, vetPhone, vetClinic, clientId,
  } = body;

  if (!name || !species || !clientId) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  // Verificar que o cliente pertence à org
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: org.id, deletedAt: null },
  });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const pet = await prisma.pet.create({
    data: {
      name,
      species: species as Species,
      breed: breed || null,
      color: color || null,
      weight: weight ? parseFloat(weight) : null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender as Gender || null,
      microchipNumber: microchipNumber || null,
      isNeutered: !!isNeutered,
      healthConditions: healthConditions || null,
      allergies: allergies || null,
      medications: medications || null,
      feedingNotes: feedingNotes || null,
      behaviorNotes: behaviorNotes || null,
      vetName: vetName || null,
      vetPhone: vetPhone || null,
      vetClinic: vetClinic || null,
      clientId,
      organizationId: org.id,
    },
  });

  await createAuditLog({
    action: "CREATE",
    entity: "Pet",
    entityId: pet.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { name, species, clientId },
  });

  return NextResponse.json(pet, { status: 201 });
}
