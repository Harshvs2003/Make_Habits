import { auth } from "./firebase.ts";

const rawApiBase = (import.meta.env.VITE_API_BASE || "").trim();

const normalizeBase = (value: string) => value.replace(/\/$/, "");

const localFallbacks = (() => {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  const host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    return [] as string[];
  }

  return [`http://${host}:5000`, `http://${host}:4000`];
})();

const candidateBases = [rawApiBase || "", ...localFallbacks].filter(Boolean).map(normalizeBase);
const uniqueCandidateBases = Array.from(new Set(candidateBases));

class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "API_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const getFreshIdToken = async (forceRefresh = false) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new ApiError("No authenticated user. Please sign in again.", 401, "NO_AUTH_USER");
  }

  return currentUser.getIdToken(forceRefresh);
};

const parseErrorMessage = async (response: Response) => {
  const body = await response.json().catch(() => null);
  return body?.message || `Request failed with status ${response.status}`;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function request(path: string, options: RequestOptions = {}) {
  const { auth: requiresAuth = true, ...init } = options;
  let lastError: Error | null = null;

  for (const base of uniqueCandidateBases) {
    try {
      const token = requiresAuth ? await getFreshIdToken(false) : "";

      const response = await fetch(`${base}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(requiresAuth ? { Authorization: `Bearer ${token}` } : {}),
          ...(init.headers || {}),
        },
      });

      if (response.status === 401 && requiresAuth) {
        // Retry once with forced token refresh for expired/stale sessions.
        const refreshedToken = await getFreshIdToken(true);
        const retryResponse = await fetch(`${base}${path}`, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshedToken}`,
            ...(init.headers || {}),
          },
        });

        if (!retryResponse.ok) {
          const retryMessage = await parseErrorMessage(retryResponse);
          throw new ApiError(retryMessage, retryResponse.status, "UNAUTHORIZED");
        }

        return retryResponse.json();
      }

      if (!response.ok) {
        const message = await parseErrorMessage(response);
        throw new ApiError(message, response.status, response.status === 401 ? "UNAUTHORIZED" : "API_ERROR");
      }

      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown request error");
    }
  }

  if (lastError instanceof ApiError) {
    throw lastError;
  }

  const baseHint = uniqueCandidateBases.join(", ") || "(no API base configured)";
  throw new Error(
    `Network error while contacting API (${baseHint}). Check backend URL, CORS, and deployment status.`
  );
}

export type Subscription = {
  plan: "free" | "pro" | "premium";
  status: string;
  habitLimit: number | null;
  adsEnabled: boolean;
};

export const api = {
  getHabits: () => request("/habits"),
  createHabit: (name: string) =>
    request("/habits", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  deleteHabit: (id: string) =>
    request(`/habits/${id}`, {
      method: "DELETE",
    }),
  getEntries: () => request("/entries"),
  setEntry: (date: string, habitId: string, status: string) =>
    request("/entries", {
      method: "POST",
      body: JSON.stringify({ date, habitId, status }),
    }),
  getDayStatus: () => request("/day-status"),
  setDayStatus: (date: string, status: string) =>
    request("/day-status", {
      method: "POST",
      body: JSON.stringify({ date, status }),
    }),
  getMe: () => request("/auth/me"),
  getPlans: () => request("/plans", { auth: false }),
  createBillingOrder: (plan: "pro" | "premium") =>
    request("/billing/create-order", {
      method: "POST",
      body: JSON.stringify({ plan }),
    }),
  verifyBillingPayment: (payload: {
    plan: "pro" | "premium";
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    request("/billing/verify-payment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
