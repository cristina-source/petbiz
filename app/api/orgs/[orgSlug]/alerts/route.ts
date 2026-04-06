import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ orgSlug: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { orgSlug } = await params;
  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
  });
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const now = new Date();
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [overdueVaccines, pendingAppointments, todayAppointments] = await Promise.all([
    prisma.vaccine.count({
      where: {
        pet: { organizationId: org.id, deletedAt: null },
        nextDueDate: { lt: now },
      },
    }),
    prisma.appointment.count({
      where: {
        organizationId: org.id,
        deletedAt: null,
        status: "PENDING",
        date: { lt: now },
      },
    }),
    prisma.appointment.count({
      where: {
        organizationId: org.id,
        deletedAt: null,
        status: { in: ["PENDING", "CONFIRMED"] },
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    }),
  ]);

  return NextResponse.json({
    overdueVaccines,
    pendingAppointments,
    todayAppointments,
    total: overdueVaccines + pendingAppointments,
  });
}
