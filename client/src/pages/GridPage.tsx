import { useEffect, useMemo, useState } from "react";
import LoadingState from "../components/LoadingState.tsx";
import { getMonthDays, monthLabel } from "../lib/date.tsx";
import { useHabitStore, type EntryStatus } from "../store/useHabitStore.tsx";

type MenuState = {
  x: number;
  y: number;
  habitId: string;
  date: string;
};

function GridPage() {
  const [cursor, setCursor] = useState(() => {
    const base = new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [menu, setMenu] = useState<MenuState | null>(null);

  const { habits, entries, dayStatus, loading, setEntry, setDayStatus } = useHabitStore();

  const monthDays = useMemo(() => getMonthDays(cursor), [cursor]);

  useEffect(() => {
    const closeMenu = () => setMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  if (loading) {
    return <LoadingState label="Loading grid view..." />;
  }

  const applyStatus = (entryStatus: EntryStatus) => {
    if (!menu) {
      return;
    }

    void setEntry(menu.date, menu.habitId, entryStatus);
    setMenu(null);
  };

  return (
    <section className="space-y-6">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 p-5 sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Grid View</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{monthLabel(cursor)}</h2>
          <p className="mt-1 text-sm text-slate-500">Swipe horizontally to move across days.</p>
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
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">On = counted</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">Skip = excluded</span>
        <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">Right-click cell for quick actions</span>
      </div>

      <div className="glass-panel overflow-hidden p-2 sm:p-3">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 min-w-48 border-b border-slate-200 bg-white px-4 py-3 text-left font-semibold text-slate-800">
                  Habit / Day
                </th>
                {monthDays.map((day) => {
                  const status = dayStatus[day.iso] || "active";
                  const skipped = status === "skipped";

                  return (
                    <th
                      key={day.iso}
                      className={`border-b border-slate-200 px-2 py-2 text-center ${
                        skipped ? "column-skipped" : "bg-white"
                      }`}
                    >
                      <button
                        onClick={() => void setDayStatus(day.iso, skipped ? "active" : "skipped")}
                        className={`w-full rounded-xl px-2 py-2 transition ${
                          skipped
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                      >
                        <div className="font-semibold">{day.dayNumber}</div>
                        <div className="text-[11px] uppercase tracking-wide">{skipped ? "Skip" : "On"}</div>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {habits.length === 0 ? (
                <tr>
                  <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-4 py-6 font-semibold text-slate-900">
                    Add habits from Today
                  </td>
                  {monthDays.map((day) => (
                    <td
                      key={`empty-${day.iso}`}
                      className={`border-b border-slate-100 px-2 py-6 text-center text-slate-400 ${
                        (dayStatus[day.iso] || "active") === "skipped" ? "column-skipped" : "bg-white"
                      }`}
                    >
                      -
                    </td>
                  ))}
                </tr>
              ) : (
                habits.map((habit) => (
                <tr key={habit.id} className="align-middle">
                  <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-4 py-3 font-semibold text-slate-900">
                    {habit.name}
                  </td>
                  {monthDays.map((day) => {
                    const dayIsSkipped = (dayStatus[day.iso] || "active") === "skipped";
                    const rawStatus = entries[day.iso]?.[habit.id] || "missed";
                    const status = rawStatus === "done" ? "done" : "missed";

                    return (
                      <td
                        key={`${habit.id}-${day.iso}`}
                        className={`border-b border-slate-100 px-2 py-2 text-center ${
                          dayIsSkipped ? "column-skipped" : "bg-white"
                        }`}
                      >
                        <button
                          disabled={dayIsSkipped}
                          onClick={() => void setEntry(day.iso, habit.id, status === "done" ? "missed" : "done")}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            if (dayIsSkipped) {
                              return;
                            }

                            setMenu({
                              x: event.clientX,
                              y: event.clientY,
                              habitId: habit.id,
                              date: day.iso,
                            });
                          }}
                          className={`h-10 w-10 rounded-xl border text-base font-bold transition ${
                            dayIsSkipped
                              ? "cursor-not-allowed border-slate-200 text-slate-400"
                              : "border-slate-200 bg-white text-slate-500 hover:-translate-y-px hover:border-blue-300 hover:shadow"
                          } ${status === "done" ? "border-blue-600 bg-blue-600 text-white" : ""}`}
                        >
                          {status === "done" ? "✓" : "·"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {menu ? (
        <div
          className="fixed z-50 min-w-36 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
          style={{ top: menu.y + 8, left: menu.x + 8 }}
        >
          <button
            className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => applyStatus("done")}
          >
            Mark Done
          </button>
          <button
            className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => applyStatus("missed")}
          >
            Mark Missed
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default GridPage;
