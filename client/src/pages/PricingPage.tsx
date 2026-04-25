import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.tsx";
import { useAuthStore } from "../store/useAuthStore.tsx";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function PricingPage() {
  const { plans, loadPlans, subscription, user, refreshProfile } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState<"pro" | "premium" | "">("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.priceInr || 0) - (b.priceInr || 0)),
    [plans]
  );

  const handleUpgrade = async (plan: "pro" | "premium") => {
    if (!user) return;

    setLoadingPlan(plan);
    setMessage("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout script.");
      }

      const order = await api.createBillingOrder(plan);

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "HabitFlow",
        description: `${plan.toUpperCase()} Subscription`,
        order_id: order.orderId,
        prefill: {
          name: user.name,
          email: user.email,
        },
        notes: {
          plan,
          uid: user.uid,
        },
        theme: {
          color: "#0f766e",
        },
        handler: async (response: Record<string, string>) => {
          await api.verifyBillingPayment({
            plan,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          await refreshProfile();
          setMessage(`Payment successful. ${plan.toUpperCase()} is now active.`);
          setLoadingPlan("");
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment failed.");
      setLoadingPlan("");
    }
  };

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-4 p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Membership</p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Choose Your Plan</h2>
        <p className="text-sm text-slate-500">Free users can keep up to 5 habits. Upgrade for higher limits and ad-free tracking.</p>

        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
          Current plan: <span className="font-semibold uppercase">{subscription?.plan || "free"}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {sortedPlans.map((plan) => {
          const isCurrent = subscription?.plan === plan.key;
          const paidPlan: "pro" | "premium" | null =
            plan.key === "pro" || plan.key === "premium" ? plan.key : null;

          return (
            <div key={plan.key} className="glass-panel space-y-4 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{plan.key}</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {plan.priceInr > 0 ? `INR ${plan.priceInr}` : "Free forever"}
                </p>
              </div>

              <ul className="space-y-2 text-sm text-slate-600">
                <li>Habit limit: {plan.habitLimit ?? "Unlimited"}</li>
                <li>{plan.adsEnabled ? "Ads enabled" : "No ads"}</li>
              </ul>

              {isCurrent ? (
                <button className="soft-button w-full" disabled>
                  Current Plan
                </button>
              ) : paidPlan ? (
                <button
                  className="primary-button w-full"
                  onClick={() => void handleUpgrade(paidPlan)}
                  disabled={loadingPlan === paidPlan}
                >
                  {loadingPlan === paidPlan ? "Opening checkout..." : `Upgrade to ${plan.name}`}
                </button>
              ) : (
                <button className="soft-button w-full" disabled>
                  Included
                </button>
              )}
            </div>
          );
        })}
      </div>

      {message ? (
        <div className="glass-panel p-4 text-sm font-medium text-slate-700">{message}</div>
      ) : null}
    </section>
  );
}

export default PricingPage;
