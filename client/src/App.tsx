import { NavLink, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import TodayPage from "./pages/TodayPage.tsx";
import MonthPage from "./pages/MonthPage.tsx";
import DayDetailsPage from "./pages/DayDetailsPage.tsx";
import GridPage from "./pages/GridPage.tsx";
import HabitsPage from "./pages/HabitsPage.tsx";
import { useHabitStore } from "./store/useHabitStore.tsx";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
    isActive
      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
      : "text-slate-600 hover:-translate-y-px hover:bg-white hover:text-slate-900 hover:shadow"
  }`;

function App() {
  const hydrate = useHabitStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-12 pt-7 sm:px-6 lg:px-8">
      <header className="glass-panel mb-7 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="space-y-2">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
            Premium Habit Tracker
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">HabitFlow</h1>
            <p className="text-sm text-slate-500">Calm daily habits with beautiful momentum.</p>
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
        </nav>
      </header>

      <main className="section-enter">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/month" element={<MonthPage />} />
          <Route path="/day/:date" element={<DayDetailsPage />} />
          <Route path="/grid" element={<GridPage />} />
          <Route path="/habits" element={<HabitsPage />} />
        </Routes>
      </main>

      <footer className="mt-6 text-center text-xs text-slate-500">
        Designed for calm consistency, not pressure.
      </footer>
    </div>
  );
}

export default App;
