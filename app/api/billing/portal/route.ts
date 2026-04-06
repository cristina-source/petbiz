import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { orgSlug } = await req.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const org = await prisma.organization.findFirst({
    where: {
      slug: orgSlug,
      deletedAt: null,
      members: { some: { userId: session.user.id } },
    },
    include: { subscription: true },
  });

  if (!org?.subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "Sem subscrição activa" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.subscription.stripeCustomerId,
    return_url: `${appUrl}/dashboard/${orgSlug}/definicoes`,
  });

  return NextResponse.json({ url: portalSession.url });
}
