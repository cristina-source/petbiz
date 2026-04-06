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

  const clients = await prisma.client.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { pets: { where: { deletedAt: null } }, appointments: { where: { deletedAt: null } } } },
    },
  });

  const header = "Nome,Email,Telefone,Morada,Pets,Marcações,Registado em";
  const rows = clients.map((c) => {
    const escape = (v: string | null) => {
      if (!v) return "";
      const s = v.replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };
    return [
      escape(c.name),
      escape(c.email),
      escape(c.phone),
      escape(c.address),
      c._count.pets,
      c._count.appointments,
      c.createdAt.toISOString().split("T")[0],
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${orgSlug}-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
