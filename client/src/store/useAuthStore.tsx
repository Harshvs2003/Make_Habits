import { create } from "zustand";
import {
  onIdTokenChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { api, type Subscription } from "../lib/api.tsx";
import { auth, googleProvider } from "../lib/firebase.ts";

type AppUser = {
  uid: string;
  email: string;
  name: string;
  picture: string;
};

type PlanConfig = {
  key: "free" | "pro" | "premium";
  name: string;
  habitLimit: number | null;
  adsEnabled: boolean;
  priceInr: number;
};

type AuthStore = {
  ready: boolean;
  loading: boolean;
  error: string;
  user: AppUser | null;
  subscription: Subscription | null;
  plans: PlanConfig[];
  initialize: () => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loadPlans: () => Promise<void>;
};

const mapFirebaseUser = (user: User | null): AppUser | null => {
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email || "",
    name: user.displayName || "",
    picture: user.photoURL || "",
  };
};

let initialized = false;

export const useAuthStore = create<AuthStore>((set, get) => ({
  ready: false,
  loading: false,
  error: "",
  user: null,
  subscription: null,
  plans: [],

  initialize: () => {
    if (initialized) return;
    initialized = true;

    set({ loading: true, error: "" });

    onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          set({ user: null, subscription: null, loading: false, ready: true });
          return;
        }

        const profile = await api.getMe();
        set({
          user: profile.user || mapFirebaseUser(firebaseUser),
          subscription: profile.subscription,
          loading: false,
          ready: true,
          error: "",
        });
      } catch (error) {
        await signOut(auth).catch(() => undefined);
        set({
          user: null,
          subscription: null,
          loading: false,
          ready: true,
          error:
            error instanceof Error
              ? `${error.message} Verify frontend and backend are using the same Firebase project.`
              : "Failed to initialize auth. Verify Firebase project configuration.",
        });
      }
    });
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: "" });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Google sign-in failed.",
      });
    }
  },

  signOutUser: async () => {
    set({ loading: true, error: "" });
    try {
      await signOut(auth);
      set({ user: null, subscription: null, loading: false, error: "" });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to sign out.",
      });
    }
  },

  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const profile = await api.getMe();
      set({ subscription: profile.subscription, user: profile.user || user, error: "" });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to refresh profile." });
    }
  },

  loadPlans: async () => {
    try {
      const plans = await api.getPlans();
      set({ plans });
    } catch (_error) {
      set({ plans: [] });
    }
  },
}));
