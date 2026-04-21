import { Link } from "react-router-dom";
import { useMemo, useState, type FormEvent } from "react";
import DayStatusToggle from "../components/DayStatusToggle.tsx";
import HabitCheckButton from "../components/HabitCheckButton.tsx";
import LoadingState from "../components/LoadingState.tsx";
import { readableDate, todayIso } from "../lib/date.tsx";
import { useHabitStore } from "../store/useHabitStore.tsx";

function TodayPage() {
  const [habitName, setHabitName] = useState("");
  const { habits, entries, dayStatus, loading, saving, error, addHabit, setEntry, setDayStatus } =
    useHabitStore();

  const today = todayIso();
  const todayStatus = dayStatus[today] || "active";
  const todayEntries = entries[today] || {};

  const doneCount = useMemo(
    () => habits.filter((habit) => todayEntries[habit.id] === "done").length,
    [habits, todayEntries]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!habitName.trim()) {
      return;
    }

    await addHabit(habitName);
    setHabitName("");
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <section className="space-y-5">
      <div className="glass-panel space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Today</p>
            <h2 className="text-2xl font-semibold text-slate-900">{readableDate(today)}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {doneCount} of {habits.length} habits completed
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saving ? <span className="text-xs text-slate-400">Saving...</span> : null}
            <Link
              to={`/day/${today}`}
              className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Open Day Details
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-500">Optional: mark this whole day as skipped.</p>
        <DayStatusToggle value={todayStatus} onChange={(value) => void setDayStatus(today, value)} />

        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            value={habitName}
            onChange={(event) => setHabitName(event.target.value)}
            placeholder="Add a new habit"
            className="w-full rounded-xl border-0 bg-slate-100 px-4 py-2 text-sm text-slate-700 outline-none ring-2 ring-transparent transition focus:ring-blue-300"
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Add
          </button>
        </form>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className={`glass-panel p-4 sm:p-5 ${todayStatus === "skipped" ? "opacity-55" : ""}`}>
        <ul className="space-y-3">
          {habits.map((habit) => {
            const status = todayEntries[habit.id] === "done" ? "done" : "missed";

            return (
              <li
                key={habit.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 transition hover:bg-slate-100"
              >
                <div>
                  <p className="font-medium text-slate-900">{habit.name}</p>
                  <p className="text-xs text-slate-500">Tap to mark done/undone</p>
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
      </div>
    </section>
  );
}

export default TodayPage;