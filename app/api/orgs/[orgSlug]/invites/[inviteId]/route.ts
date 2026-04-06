import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ orgSlug: string; inviteId: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug, inviteId } = await params;

  const org = await prisma.organization.findFirst({
    where: {
      slug: orgSlug,
      deletedAt: null,
      members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
    },
  });
  if (!org) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const invite = await prisma.invite.findFirst({
    where: { id: inviteId, organizationId: org.id, acceptedAt: null },
  });
  if (!invite) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  await prisma.invite.delete({ where: { id: inviteId } });

  await createAuditLog({
    action: "DELETE",
    entity: "Invite",
    entityId: inviteId,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { email: invite.email },
  });

  return NextResponse.json({ ok: true });
}
