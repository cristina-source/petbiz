import { NextResponse } from "next/server";
import { getSession as auth } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { PLANS, type PlanKey } from "@/lib/plans";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { planKey, orgSlug } = body as { planKey: PlanKey; orgSlug: string };

  const plan = PLANS[planKey];
  if (!plan || !plan.stripePriceId) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const org = await prisma.organization.findFirst({
    where: {
      slug: orgSlug,
      deletedAt: null,
      members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
    },
    include: { subscription: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  }

  let customerId = org.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;

    await prisma.subscription.upsert({
      where: { organizationId: org.id },
      create: {
        organizationId: org.id,
        stripeCustomerId: customer.id,
        status: "FREE",
        plan: "FREE",
      },
      update: { stripeCustomerId: customer.id },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/${orgSlug}/definicoes?upgrade=success`,
    cancel_url: `${appUrl}/dashboard/${orgSlug}/definicoes`,
    allow_promotion_codes: true,
    metadata: { organizationId: org.id },
    subscription_data: {
      metadata: { organizationId: org.id },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
