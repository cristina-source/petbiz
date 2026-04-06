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

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug } = await params;
  const org = await getOrg(orgSlug, session.user.id);
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const services = await prisma.service.findMany({
    where: { organizationId: org.id, deletedAt: null, isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(services);
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
  const { name, description, category, duration, price, color } = body;

  if (!name || !duration || price === undefined) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      name,
      description: description || null,
      category: category || null,
      duration: parseInt(duration),
      price: parseFloat(price),
      color: color || null,
      organizationId: org.id,
    },
  });

  await createAuditLog({
    action: "CREATE",
    entity: "Service",
    entityId: service.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { name },
  });

  return NextResponse.json(service, { status: 201 });
}
