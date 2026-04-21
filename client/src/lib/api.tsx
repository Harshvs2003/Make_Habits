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

const candidateBases = [
  rawApiBase || "",
  ...localFallbacks,
].filter(Boolean).map(normalizeBase);

const uniqueCandidateBases = Array.from(new Set(candidateBases));

async function request(path: string, init?: RequestInit) {
  let lastError: Error | null = null;

  for (const base of uniqueCandidateBases) {
    try {
      const response = await fetch(`${base}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
        ...init,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Request failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown request error");
    }
  }

  const baseHint = uniqueCandidateBases.join(", ") || "(no API base configured)";
  throw new Error(`Failed to fetch from API. Tried: ${baseHint}. ${lastError?.message || ""}`.trim());
}

export const api = {
  getHabits: () => request("/habits"),
  createHabit: (name: string) =>
    request("/habits", {
      method: "POST",
      body: JSON.stringify({ name }),
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
};