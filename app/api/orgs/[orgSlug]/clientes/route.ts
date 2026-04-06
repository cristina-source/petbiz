import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ orgSlug: string }>;
}

async function getOrg(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: {
      slug: orgSlug,
      deletedAt: null,
      members: { some: { userId } },
    },
  });
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const clients = await prisma.client.findMany({
    where: {
      organizationId: org.id,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { pets: { where: { deletedAt: null } } },
  });

  return NextResponse.json(clients);
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });

  const body = await req.json();
  const { name, email, phone, taxId, address, city, notes } = body;

  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      taxId: taxId || null,
      address: address || null,
      city: city || null,
      notes: notes || null,
      organizationId: org.id,
    },
  });

  await createAuditLog({
    action: "CREATE",
    entity: "Client",
    entityId: client.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { name },
  });

  return NextResponse.json(client, { status: 201 });
}
