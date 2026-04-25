import { NavLink, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import TodayPage from "./pages/TodayPage.tsx";
import MonthPage from "./pages/MonthPage.tsx";
import DayDetailsPage from "./pages/DayDetailsPage.tsx";
import GridPage from "./pages/GridPage.tsx";
import HabitsPage from "./pages/HabitsPage.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import LoadingState from "./components/LoadingState.tsx";
import { useHabitStore } from "./store/useHabitStore.tsx";
import { useAuthStore } from "./store/useAuthStore.tsx";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
    isActive
      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
      : "text-slate-600 hover:-translate-y-px hover:bg-white hover:text-slate-900 hover:shadow"
  }`;

function App() {
  const hydrate = useHabitStore((state) => state.hydrate);
  const clearData = useHabitStore((state) => state.clearData);

  const { ready, loading, user, subscription, error, initialize, signInWithGoogle, signOutUser } =
    useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user) {
      void hydrate();
      return;
    }

    clearData();
  }, [user, hydrate, clearData]);

  if (!ready || loading) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <LoadingState label="Initializing secure session..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="glass-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-emerald-200/35 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                HabitFlow
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Build better habits, one calm day at a time
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  HabitFlow helps you stay consistent without pressure. Track daily wins, see monthly progress,
                  and manage everything in your own private account from anywhere.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Private Data</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Your habits belong only to you</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Smart Insights</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Daily, monthly, and trend views</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Any Device</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Access your progress anywhere</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-lg shadow-slate-900/5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Start Securely</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Continue with Google</h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign in once and jump directly to your personal habit dashboard.
              </p>

              <button className="primary-button mt-5 w-full" onClick={() => void signInWithGoogle()}>
                Sign In with Google
              </button>

              <p className="mt-3 text-center text-xs text-slate-500">By signing in, your data syncs to your account.</p>

              {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-12 pt-7 sm:px-6 lg:px-8">
      <header className="glass-panel mb-7 flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Premium Habit Tracker
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">HabitFlow</h1>
              <p className="text-sm text-slate-500">Calm daily habits with beautiful momentum.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              Plan: {subscription?.plan || "free"}
            </span>
            <span className="rounded-xl bg-white px-3 py-2 text-xs text-slate-500">
              {user.name || user.email}
            </span>
            <button className="soft-button" onClick={() => void signOutUser()}>
              Sign Out
            </button>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 rounded-2xl bg-slate-100/80 p-1.5">
          <NavLink to="/" className={navLinkClass} end>
            Today
          </NavLink>
          <NavLink to="/month" className={navLinkClass}>
            Month
          </NavLink>
          <NavLink to="/grid" className={navLinkClass}>
            Grid
          </NavLink>
          <NavLink to="/habits" className={navLinkClass}>
            Habits
          </NavLink>
          <NavLink to="/pricing" className={navLinkClass}>
            Pricing
          </NavLink>
        </nav>
      </header>

      <main className="section-enter">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/month" element={<MonthPage />} />
          <Route path="/day/:date" element={<DayDetailsPage />} />
          <Route path="/grid" element={<GridPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Routes>
      </main>

      <footer className="mt-6 text-center text-xs text-slate-500">
        Designed for calm consistency, not pressure.
      </footer>
    </div>
  );
}

export default App;
