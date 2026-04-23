import { Link, useParams } from "react-router-dom";
import DayStatusToggle from "../components/DayStatusToggle.tsx";
import HabitCheckButton from "../components/HabitCheckButton.tsx";
import LoadingState from "../components/LoadingState.tsx";
import { isIsoDate, readableDate } from "../lib/date.tsx";
import { useHabitStore } from "../store/useHabitStore.tsx";

function DayDetailsPage() {
  const { date = "" } = useParams();
  const { habits, entries, dayStatus, loading, setEntry, setDayStatus } = useHabitStore();

  if (!isIsoDate(date)) {
    return (
      <div className="glass-panel space-y-3 p-6">
        <p className="text-sm font-medium text-rose-600">Invalid date format. Use YYYY-MM-DD.</p>
        <Link className="soft-button inline-flex" to="/">
          Back to Today
        </Link>
      </div>
    );
  }

  if (loading) {
    return <LoadingState label="Loading day details..." />;
  }

  const currentDayStatus = dayStatus[date] || "active";
  const dayEntries = entries[date] || {};

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-5 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Day Details</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{readableDate(date)}</h2>
          </div>
          <Link to="/" className="soft-button">
            Back to Today
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Whole-day control</p>
            <p className="text-xs text-slate-500">Skip the whole day to avoid guilt-based streak breaks.</p>
          </div>
          <DayStatusToggle value={currentDayStatus} onChange={(value) => void setDayStatus(date, value)} />
        </div>
      </div>

      <div className={`glass-panel p-4 sm:p-5 ${currentDayStatus === "skipped" ? "opacity-60" : ""}`}>
        {habits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
            <p className="text-base font-semibold text-slate-700">No habits found</p>
            <p className="mt-1 text-sm text-slate-500">Add habits from Today and they will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {habits.map((habit) => {
            const status = dayEntries[habit.id] === "done" ? "done" : "missed";

            return (
              <li
                key={habit.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 transition hover:-translate-y-px hover:shadow"
              >
                <div>
                  <p className="font-semibold text-slate-900">{habit.name}</p>
                  <p className="text-xs text-slate-500">
                    {status === "done" ? "Marked complete" : "Not complete yet"}
                  </p>
                </div>
                <HabitCheckButton
                  disabled={currentDayStatus === "skipped"}
                  status={status}
                  onToggleDone={() => void setEntry(date, habit.id, status === "done" ? "missed" : "done")}
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

export default DayDetailsPage;
