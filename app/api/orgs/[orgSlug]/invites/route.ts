import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { sendInviteEmail } from "@/lib/email";

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

export async function POST(req: Request, { params }: RouteParams) {
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
  const { email, role } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
  }

  const validRoles = ["ADMIN", "MANAGER", "COLLABORATOR", "VET"];
  const memberRole = validRoles.includes(role) ? role : "COLLABORATOR";

  const existingMember = await prisma.orgMember.findFirst({
    where: {
      organizationId: org.id,
      user: { email: email.toLowerCase().trim() },
    },
  });
  if (existingMember) {
    return NextResponse.json({ error: "Este utilizador já é membro da organização" }, { status: 409 });
  }

  const existingInvite = await prisma.invite.findFirst({
    where: {
      organizationId: org.id,
      email: email.toLowerCase().trim(),
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "Já existe um convite pendente para este email" }, { status: 409 });
  }

  const invite = await prisma.invite.create({
    data: {
      email: email.toLowerCase().trim(),
      role: memberRole,
      organizationId: org.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await createAuditLog({
    action: "CREATE",
    entity: "Invite",
    entityId: invite.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { email: invite.email, role: memberRole },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${invite.token}`;
  const orgName = org.businessName ?? org.name;

  try {
    await sendInviteEmail({
      to: invite.email,
      inviteUrl,
      orgName,
      inviterName: session.user.name ?? session.user.email ?? "Administrador",
    });
  } catch {
    // Email send failed but invite was created — don't block
  }

  return NextResponse.json({ ok: true, inviteId: invite.id });
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { orgSlug } = await params;
  const org = await getOrgAsAdmin(orgSlug, session.user.id);
  if (!org) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const invites = await prisma.invite.findMany({
    where: {
      organizationId: org.id,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
}
