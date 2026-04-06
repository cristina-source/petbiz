import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ orgSlug: string; petId: string }>;
}

async function getOrgAndPet(orgSlug: string, petId: string, userId: string) {
  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId } } },
  });
  if (!org) return null;
  const pet = await prisma.pet.findFirst({
    where: { id: petId, organizationId: org.id, deletedAt: null },
  });
  return pet ? { org, pet } : null;
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { orgSlug, petId } = await params;
  const ctx = await getOrgAndPet(orgSlug, petId, session.user.id);
  if (!ctx) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const { name, date, nextDueDate, lotNumber, notes } = body;

  if (!name || !date) {
    return NextResponse.json({ error: "Nome e data são obrigatórios" }, { status: 400 });
  }

  const vaccine = await prisma.vaccine.create({
    data: {
      name,
      date: new Date(date),
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      lotNumber: lotNumber || null,
      notes: notes || null,
      petId,
    },
  });

  return NextResponse.json(vaccine, { status: 201 });
}
