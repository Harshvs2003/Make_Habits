import { Link } from "react-router-dom";
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

  const topHabit = useMemo(
    () => perHabit.slice().sort((a, b) => b.percent - a.percent)[0],
    [perHabit]
  );

  if (loading) {
    return <LoadingState label="Loading monthly overview..." />;
  }

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-5 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Monthly Overview</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{monthLabel(cursor)}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="soft-button"
              onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              Previous
            </button>
            <button
              className="soft-button"
              onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-lg shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Total Consistency</p>
            <p className="mt-2 text-3xl font-bold">{consistency}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Active Days</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{activeDays.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Skipped Days</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{days.length - activeDays.length}</p>
          </div>
        </div>

        {topHabit ? (
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.12em] text-blue-700">Best Performer</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {topHabit.habit.name} at {topHabit.percent}%
            </p>
          </div>
        ) : null}
      </div>

      <div className="glass-panel space-y-5 p-5 sm:p-7">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Habit Consistency</h3>
        {perHabit.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
            <p className="text-base font-semibold text-slate-700">No habits to analyze yet</p>
            <p className="mt-1 text-sm text-slate-500">Create habits from Habit Library to unlock monthly insights.</p>
          </div>
        ) : (
          perHabit.map((row) => (
            <div key={row.habit.id} className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">{row.habit.name}</span>
                <span className="text-slate-500">
                  {row.completed}/{row.total} days
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${row.percent}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="glass-panel space-y-3 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Open Day Details</h3>
          <span className="text-xs text-slate-500">Tap a date to edit that day</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <Link
              key={day.iso}
              to={`/day/${day.iso}`}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-px hover:border-blue-200 hover:bg-blue-50"
            >
              {day.dayNumber}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MonthPage;