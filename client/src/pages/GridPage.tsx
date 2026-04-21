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
    <section className="space-y-5">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Grid View</p>
          <h2 className="text-2xl font-semibold text-slate-900">{monthLabel(cursor)}</h2>
          <p className="text-sm text-slate-500">Sticky habit names with horizontal day scroll.</p>
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

      <div className="glass-panel overflow-hidden p-2 sm:p-3">
        <div className="overflow-x-auto">
          <table className="min-w-[880px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 min-w-44 bg-white px-4 py-3 text-left font-semibold text-slate-800">
                  Day Status
                </th>
                {monthDays.map((day) => {
                  const status = dayStatus[day.iso] || "active";
                  const skipped = status === "skipped";

                  return (
                    <th key={day.iso} className={`px-2 py-2 text-center ${skipped ? "column-skipped" : "bg-white"}`}>
                      <button
                        onClick={() => void setDayStatus(day.iso, skipped ? "active" : "skipped")}
                        className={`w-full rounded-lg px-2 py-2 transition ${
                          skipped
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        <div className="font-semibold">{day.dayNumber}</div>
                        <div className="text-xs">{skipped ? "SKIP" : "ON"}</div>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => (
                <tr key={habit.id} className="align-middle">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-slate-900">
                    {habit.name}
                  </td>
                  {monthDays.map((day) => {
                    const dayIsSkipped = (dayStatus[day.iso] || "active") === "skipped";
                    const rawStatus = entries[day.iso]?.[habit.id] || "missed";
                    const status = rawStatus === "done" ? "done" : "missed";
                    const label = status === "done" ? "OK" : ".";

                    return (
                      <td
                        key={`${habit.id}-${day.iso}`}
                        className={`px-2 py-2 text-center ${dayIsSkipped ? "column-skipped" : "bg-white"}`}
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
                          className={`h-10 w-10 rounded-lg text-base font-semibold transition ${
                            dayIsSkipped
                              ? "cursor-not-allowed"
                              : "bg-slate-100 text-slate-700 hover:scale-105 hover:bg-blue-100 active:scale-95"
                          } ${status === "done" ? "bg-blue-600 text-white" : ""}`}
                        >
                          {label}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {menu ? (
        <div
          className="fixed z-50 min-w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          style={{ top: menu.y + 6, left: menu.x + 6 }}
        >
          <button
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
            onClick={() => applyStatus("done")}
          >
            Done
          </button>
          <button
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
            onClick={() => applyStatus("missed")}
          >
            Missed
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default GridPage;