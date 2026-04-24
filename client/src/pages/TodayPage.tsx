import { Link } from "react-router-dom";
import { useMemo } from "react";
import DayStatusToggle from "../components/DayStatusToggle.tsx";
import HabitCheckButton from "../components/HabitCheckButton.tsx";
import LoadingState from "../components/LoadingState.tsx";
import { readableDate, todayIso } from "../lib/date.tsx";
import { useHabitStore } from "../store/useHabitStore.tsx";

function TodayPage() {
  const { habits, entries, dayStatus, loading, saving, error, setEntry, setDayStatus } =
    useHabitStore();

  const today = todayIso();
  const todayStatus = dayStatus[today] || "active";
  const todayEntries = entries[today] || {};

  const doneCount = useMemo(
    () => habits.filter((habit) => todayEntries[habit.id] === "done").length,
    [habits, todayEntries]
  );
  const completionPercent = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;

  if (loading) {
    return <LoadingState />;
  }

  return (
    <section className="space-y-6">
      <div className="glass-panel relative overflow-hidden p-5 sm:p-7">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-blue-200/40 blur-2xl" />
        <div className="relative space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Today</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {readableDate(today)}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {doneCount} of {habits.length} habits completed
              </p>
              <div className="mt-3 h-2 w-52 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saving ? <span className="text-xs text-slate-500">Saving updates...</span> : null}
              <Link to="/habits" className="soft-button">
                Manage Habits
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Whole-day control</p>
              <p className="text-xs text-slate-500">Set one full day as skipped when life gets busy.</p>
            </div>
            <DayStatusToggle value={todayStatus} onChange={(value) => void setDayStatus(today, value)} />
          </div>

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        </div>
      </div>

      <div className={`glass-panel p-4 sm:p-5 ${todayStatus === "skipped" ? "opacity-60" : ""}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Your Habit List</h3>
          <span className="text-xs text-slate-500">Tap to toggle done</span>
        </div>

        {habits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
            <p className="text-base font-semibold text-slate-700">No habits yet</p>
            <p className="mt-1 text-sm text-slate-500">Go to Habit Library and add your first habit.</p>
            <Link to="/habits" className="primary-button mt-4 inline-flex">
              Open Habit Library
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {habits.map((habit) => {
              const status = todayEntries[habit.id] ?? "missed";

              return (
                <li
                  key={habit.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 transition hover:-translate-y-px hover:shadow"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{habit.name}</p>
                    <p className="text-xs text-slate-500">
                      {status === "done" ? "Completed for today" : "Waiting for completion"}
                    </p>
                  </div>

                  <HabitCheckButton
                    disabled={todayStatus === "skipped"}
                    status={status}
                    onToggleDone={() =>
                      void setEntry(today, habit.id, status === "done" ? "missed" : "done")
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default TodayPage;
