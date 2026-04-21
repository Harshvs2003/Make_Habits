import { NavLink, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import TodayPage from "./pages/TodayPage.tsx";
import MonthPage from "./pages/MonthPage.tsx";
import DayDetailsPage from "./pages/DayDetailsPage.tsx";
import GridPage from "./pages/GridPage.tsx";
import { useHabitStore } from "./store/useHabitStore.tsx";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-3 py-2 text-sm font-medium transition-all ${
    isActive
      ? "bg-blue-600 text-white shadow-md"
      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
  }`;

function App() {
  const hydrate = useHabitStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <header className="glass-panel mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">HabitFlow</h1>
          <p className="text-sm text-slate-500">Calm daily habits, powerful monthly insight.</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          <NavLink to="/" className={navLinkClass} end>
            Today
          </NavLink>
          <NavLink to="/month" className={navLinkClass}>
            Month
          </NavLink>
          <NavLink to="/grid" className={navLinkClass}>
            Grid
          </NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/month" element={<MonthPage />} />
          <Route path="/day/:date" element={<DayDetailsPage />} />
          <Route path="/grid" element={<GridPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;