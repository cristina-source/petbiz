import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ orgSlug: string; memberId: string }>;
}

async function getOrgAndVerifyAdmin(orgSlug: string, userId: string) {
  const org = await prisma.organization.findFirst({
    where: {
      slug: orgSlug,
      deletedAt: null,
      members: { some: { userId, role: { in: ["OWNER", "ADMIN"] } } },
    },
  });
  return org;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug, memberId } = await params;
  const org = await getOrgAndVerifyAdmin(orgSlug, session.user.id);
  if (!org) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const member = await prisma.orgMember.findFirst({
    where: { id: memberId, organizationId: org.id },
    include: { user: { select: { email: true } } },
  });
  if (!member) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  if (member.role === "OWNER") {
    return NextResponse.json({ error: "Não é possível alterar o papel do dono" }, { status: 403 });
  }

  const body = await req.json();
  const { role } = body;

  const validRoles = ["ADMIN", "MANAGER", "COLLABORATOR", "VET"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Papel inválido" }, { status: 400 });
  }

  await prisma.orgMember.update({
    where: { id: memberId },
    data: { role },
  });

  await createAuditLog({
    action: "UPDATE",
    entity: "OrgMember",
    entityId: memberId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { email: member.user.email ?? "", newRole: role, oldRole: member.role },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug, memberId } = await params;
  const org = await getOrgAndVerifyAdmin(orgSlug, session.user.id);
  if (!org) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const member = await prisma.orgMember.findFirst({
    where: { id: memberId, organizationId: org.id },
    include: { user: { select: { email: true } } },
  });
  if (!member) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  if (member.role === "OWNER") {
    return NextResponse.json({ error: "Não é possível remover o dono da organização" }, { status: 403 });
  }

  if (member.userId === session.user.id) {
    return NextResponse.json({ error: "Não podes remover-te a ti próprio" }, { status: 403 });
  }

  await prisma.orgMember.delete({ where: { id: memberId } });

  await createAuditLog({
    action: "DELETE",
    entity: "OrgMember",
    entityId: memberId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { email: member.user.email ?? "", role: member.role },
  });

  return NextResponse.json({ ok: true });
}
