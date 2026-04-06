import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getPlanFromPriceId } from "@/lib/plans";
import type { Plan } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const orgId: string | undefined =
    event.data.object?.metadata?.organizationId;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && orgId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const planKey = getPlanFromPriceId(sub.items.data[0].price.id);
          const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end;
          await prisma.subscription.upsert({
            where: { organizationId: orgId },
            create: {
              organizationId: orgId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
              status: "ACTIVE",
              plan: planKey as Plan,
            },
            update: {
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
              status: "ACTIVE",
              plan: planKey as Plan,
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string | null;
        if (orgId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const planKey = getPlanFromPriceId(sub.items.data[0].price.id);
          const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end;
          await prisma.subscription.updateMany({
            where: { organizationId: orgId },
            data: {
              status: "ACTIVE",
              plan: planKey as Plan,
              stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        if (orgId) {
          await prisma.subscription.updateMany({
            where: { organizationId: orgId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        if (orgId) {
          await prisma.subscription.updateMany({
            where: { organizationId: orgId },
            data: { status: "CANCELED", plan: "FREE" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
