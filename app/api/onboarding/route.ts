import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import type { BusinessType, RevenueModel, Species } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    businessType,
    businessName,
    city,
    slug: rawSlug,
    openTime,
    closeTime,
    species,
    services: _services,
    revenueModel,
  } = body;

  if (!businessName || !businessType) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  // Garantir slug único
  let slug = rawSlug;
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const org = await prisma.organization.create({
    data: {
      name: businessName,
      slug,
      city,
      businessType: businessType as BusinessType,
      businessName,
      revenueModel: revenueModel as RevenueModel,
      onboardingStep: 5,
      onboardingDone: true,
      openingHours: {
        mon: { open: openTime, close: closeTime },
        tue: { open: openTime, close: closeTime },
        wed: { open: openTime, close: closeTime },
        thu: { open: openTime, close: closeTime },
        fri: { open: openTime, close: closeTime },
        sat: { open: null, close: null },
        sun: { open: null, close: null },
      },
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
      subscription: {
        create: {
          plan: "FREE",
          status: "FREE",
        },
      },
      speciesServed: {
        create: (species as string[]).map((s) => ({ species: s as Species })),
      },
    },
  });

  await createAuditLog({
    action: "CREATE",
    entity: "Organization",
    entityId: org.id,
    organizationId: org.id,
    userId: session.user.id,
    metadata: { businessType, businessName },
  });

  return NextResponse.json({ orgSlug: org.slug });
}
