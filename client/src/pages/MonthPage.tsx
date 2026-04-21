import { useMemo, useState } from "react";
import LoadingState from "../components/LoadingState.tsx";
import { getMonthDays, monthLabel } from "../lib/date.tsx";
import { useHabitStore } from "../store/useHabitStore.tsx";

function MonthPage() {
  const [cursor, setCursor] = useState(() => {
    const base = new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const { habits, entries, dayStatus, loading } = useHabitStore();

  const days = useMemo(() => getMonthDays(cursor), [cursor]);
  const activeDays = useMemo(
    () => days.filter((day) => (dayStatus[day.iso] || "active") === "active"),
    [days, dayStatus]
  );

  const perHabit = useMemo(
    () =>
      habits.map((habit) => {
        const completed = activeDays.filter((day) => entries[day.iso]?.[habit.id] === "done").length;
        const total = activeDays.length;
        const percent = total ? Math.round((completed / total) * 100) : 0;

        return { habit, completed, total, percent };
      }),
    [habits, activeDays, entries]
  );

  const consistency = useMemo(() => {
    const totalDone = perHabit.reduce((sum, row) => sum + row.completed, 0);
    const totalPossible = perHabit.reduce((sum, row) => sum + row.total, 0);
    return totalPossible ? Math.round((totalDone / totalPossible) * 100) : 0;
  }, [perHabit]);

  if (loading) {
    return <LoadingState label="Loading monthly overview..." />;
  }

  return (
    <section className="space-y-5">
      <div className="glass-panel space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Monthly Overview</p>
            <h2 className="text-2xl font-semibold text-slate-900">{monthLabel(cursor)}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
              onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              Prev
            </button>
            <button
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
              onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-blue-600 px-4 py-4 text-white">
            <p className="text-xs uppercase tracking-wide text-blue-100">Total Consistency</p>
            <p className="mt-2 text-3xl font-semibold">{consistency}%</p>
          </div>
          <div className="rounded-xl bg-slate-100 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active Days</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{activeDays.length}</p>
          </div>
          <div className="rounded-xl bg-slate-100 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Skipped Days</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{days.length - activeDays.length}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel space-y-4 p-5 sm:p-6">
        {perHabit.map((row) => (
          <div key={row.habit.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">{row.habit.name}</span>
              <span className="text-slate-500">
                {row.completed}/{row.total} days
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default MonthPage;