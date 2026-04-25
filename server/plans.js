const PLAN_CONFIG = {
  free: {
    key: "free",
    name: "Free",
    habitLimit: 5,
    adsEnabled: true,
    priceInr: 0,
  },
  pro: {
    key: "pro",
    name: "Pro",
    habitLimit: 25,
    adsEnabled: false,
    priceInr: Number(process.env.RAZORPAY_PRO_AMOUNT_INR || 199),
  },
  premium: {
    key: "premium",
    name: "Premium",
    habitLimit: null,
    adsEnabled: false,
    priceInr: Number(process.env.RAZORPAY_PREMIUM_AMOUNT_INR || 499),
  },
};

const getPlanConfig = (plan) => PLAN_CONFIG[plan] || PLAN_CONFIG.free;

const buildSubscriptionFromPlan = (plan) => {
  const cfg = getPlanConfig(plan);
  return {
    plan: cfg.key,
    status: "active",
    habitLimit: cfg.habitLimit,
    adsEnabled: cfg.adsEnabled,
  };
};

const publicPlans = () =>
  Object.values(PLAN_CONFIG).map((cfg) => ({
    key: cfg.key,
    name: cfg.name,
    habitLimit: cfg.habitLimit,
    adsEnabled: cfg.adsEnabled,
    priceInr: cfg.priceInr,
  }));

module.exports = {
  PLAN_CONFIG,
  getPlanConfig,
  buildSubscriptionFromPlan,
  publicPlans,
};
