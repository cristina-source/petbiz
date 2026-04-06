import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ orgSlug: string }>;
}

const TYPE_PT: Record<string, string> = { INCOME: "Receita", EXPENSE: "Despesa", REFUND: "Reembolso" };
const STATUS_PT: Record<string, string> = { PAID: "Pago", PENDING: "Pendente", CANCELLED: "Cancelado" };
const METHOD_PT: Record<string, string> = {
  CASH: "Dinheiro", CARD: "Cartão", TRANSFER: "Transferência", MBWAY: "MB WAY", OTHER: "Outro",
};

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { orgSlug } = await params;
  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null, members: { some: { userId: session.user.id } } },
  });
  if (!org) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId: org.id,
      deletedAt: null,
      ...(from || to ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    },
    orderBy: { date: "desc" },
  });

  const header = "Data,Tipo,Descrição,Valor,Método,Estado,Notas";
  const rows = transactions.map((tx) => {
    const escape = (v: string | null) => {
      if (!v) return "";
      const s = v.replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };
    return [
      tx.date.toISOString().split("T")[0],
      TYPE_PT[tx.type] || tx.type,
      escape(tx.description),
      tx.amount.toFixed(2),
      tx.method ? (METHOD_PT[tx.method] || tx.method) : "",
      STATUS_PT[tx.status] || tx.status,
      escape(tx.notes),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="financeiro-${orgSlug}-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
