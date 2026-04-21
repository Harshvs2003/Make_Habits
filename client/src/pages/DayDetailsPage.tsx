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
        <p className="text-sm text-rose-600">Invalid date format. Use YYYY-MM-DD.</p>
        <Link className="text-sm font-medium text-blue-600" to="/">
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
    <section className="space-y-5">
      <div className="glass-panel space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Day Details</p>
            <h2 className="text-2xl font-semibold text-slate-900">{readableDate(date)}</h2>
          </div>
          <Link
            to="/"
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Back to Today
          </Link>
        </div>

        <p className="text-xs text-slate-500">Optional: mark this whole day as skipped.</p>
        <DayStatusToggle value={currentDayStatus} onChange={(value) => void setDayStatus(date, value)} />
      </div>

      <div className={`glass-panel p-4 sm:p-5 ${currentDayStatus === "skipped" ? "opacity-55" : ""}`}>
        <ul className="space-y-3">
          {habits.map((habit) => {
            const status = dayEntries[habit.id] === "done" ? "done" : "missed";

            return (
              <li key={habit.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                <span className="font-medium text-slate-900">{habit.name}</span>
                <HabitCheckButton
                  disabled={currentDayStatus === "skipped"}
                  status={status}
                  onToggleDone={() => void setEntry(date, habit.id, status === "done" ? "missed" : "done")}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default DayDetailsPage;