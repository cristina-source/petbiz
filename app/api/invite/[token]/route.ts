import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Este convite já foi aceite" }, { status: 409 });
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Este convite expirou" }, { status: 410 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "O email da tua conta não corresponde ao email do convite" },
      { status: 403 }
    );
  }

  const existingMember = await prisma.orgMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: invite.organizationId,
      },
    },
  });

  if (existingMember) {
    await prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return NextResponse.json({ ok: true, slug: invite.organization.slug });
  }

  await prisma.$transaction([
    prisma.orgMember.create({
      data: {
        userId: session.user.id,
        organizationId: invite.organizationId,
        role: invite.role,
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  await createAuditLog({
    action: "CREATE",
    entity: "OrgMember",
    entityId: session.user.id,
    organizationId: invite.organizationId,
    userId: session.user.id,
    metadata: { email: invite.email, role: invite.role, via: "invite" },
  });

  return NextResponse.json({ ok: true, slug: invite.organization.slug });
}
