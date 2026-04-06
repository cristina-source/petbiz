export const PLANS = {
  FREE: {
    name: "Gratuito",
    price: 0,
    stripePriceId: null,
    limits: {
      clients: 20,
      members: 1,
      appointments: 50,
      products: 10,
    },
    features: {
      onlineBooking: false,
      financialReports: false,
      advancedAnalytics: false,
      api: false,
      prioritySupport: false,
      multiUnit: false,
    },
  },
  STARTER: {
    name: "Starter",
    price: 19,
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
    limits: {
      clients: 200,
      members: 3,
      appointments: -1,
      products: 100,
    },
    features: {
      onlineBooking: true,
      financialReports: false,
      advancedAnalytics: false,
      api: false,
      prioritySupport: false,
      multiUnit: false,
    },
  },
  PRO: {
    name: "Pro",
    price: 49,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    limits: {
      clients: -1,
      members: 10,
      appointments: -1,
      products: -1,
    },
    features: {
      onlineBooking: true,
      financialReports: true,
      advancedAnalytics: true,
      api: false,
      prioritySupport: false,
      multiUnit: false,
    },
  },
  TEAM: {
    name: "Equipa",
    price: 99,
    stripePriceId: process.env.STRIPE_PRICE_TEAM,
    limits: {
      clients: -1,
      members: -1,
      appointments: -1,
      products: -1,
    },
    features: {
      onlineBooking: true,
      financialReports: true,
      advancedAnalytics: true,
      api: true,
      prioritySupport: true,
      multiUnit: true,
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type PlanFeature = keyof (typeof PLANS)["FREE"]["features"];
export type PlanLimit = keyof (typeof PLANS)["FREE"]["limits"];

export function checkLimit(
  plan: PlanKey,
  resource: PlanLimit,
  current: number
): boolean {
  const limit = PLANS[plan].limits[resource];
  if (limit === -1) return true;
  return current < limit;
}

export function hasFeature(plan: PlanKey, feature: PlanFeature): boolean {
  return PLANS[plan].features[feature];
}

export function getPlanFromPriceId(priceId: string): PlanKey {
  for (const [key, plan] of Object.entries(PLANS)) {
    if ("stripePriceId" in plan && plan.stripePriceId === priceId) {
      return key as PlanKey;
    }
  }
  return "FREE";
}
