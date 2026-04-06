import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ orgSlug: string }>;
}

async function getOrgAsAdmin(orgSlug: string, userId: string) {
  return prisma.organization.findFirst({
    where: {
      slug: orgSlug,
      deletedAt: null,
      members: { some: { userId, role: { in: ["OWNER", "ADMIN"] } } },
    },
  });
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug } = await params;
  const org = await prisma.organization.findFirst({
    where: {
      slug: orgSlug,
      deletedAt: null,
      members: { some: { userId: session.user.id } },
    },
    select: {
      businessName: true,
      name: true,
      city: true,
      phone: true,
      address: true,
      slug: true,
      businessType: true,
    },
  });
  if (!org) {
    return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  }
  return NextResponse.json(org);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug } = await params;
  const org = await getOrgAsAdmin(orgSlug, session.user.id);
  if (!org) {
    return NextResponse.json({ error: "Sem permissão ou organização não encontrada" }, { status: 403 });
  }

  const body = await req.json();
  const { businessName, name, city, phone, address } = body;

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      ...(businessName !== undefined && { businessName }),
      ...(name !== undefined && { name }),
      ...(city !== undefined && { city }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entity: "Organization",
    entityId: org.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { businessName: updated.businessName ?? "", city: updated.city ?? "" },
  });

  return NextResponse.json({ ok: true, slug: updated.slug });
}
