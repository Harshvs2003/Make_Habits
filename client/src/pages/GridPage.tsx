import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import LoadingState from "../components/LoadingState.tsx";
import { canEditDate, getMonthDays, monthLabel } from "../lib/date.tsx";
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
  const now = new Date();
  const isFutureMonth =
    cursor.getFullYear() > now.getFullYear() ||
    (cursor.getFullYear() === now.getFullYear() && cursor.getMonth() > now.getMonth());
  const monthStartLabel = new Date(cursor.getFullYear(), cursor.getMonth(), 1).toLocaleDateString(
    undefined,
    { month: "long", day: "numeric", year: "numeric" }
  );
  const activeDays = useMemo(
    () => monthDays.filter((day) => (dayStatus[day.iso] || "active") === "active"),
    [monthDays, dayStatus]
  );
  const skippedDays = monthDays.length - activeDays.length;
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

  useEffect(() => {
    const closeMenu = () => setMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  if (loading) {
    return <LoadingState label="Loading grid view..." />;
  }

  const applyStatus = (entryStatus: EntryStatus) => {
    if (!menu || isFutureMonth || !canEditDate(menu.date)) {
      return;
    }

    void setEntry(menu.date, menu.habitId, entryStatus);
    setMenu(null);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 glass-panel sm:p-7">
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
        <span className="px-3 py-1 font-medium rounded-full bg-emerald-100 text-emerald-800">On = counted</span>
        <span className="px-3 py-1 font-medium rounded-full bg-amber-100 text-amber-800">Skip = excluded</span>
        <span className="px-3 py-1 font-medium text-blue-800 bg-blue-100 rounded-full">Right-click cell for quick actions</span>
      </div>
      {isFutureMonth ? (
        <div className="px-4 py-3 text-sm border rounded-2xl border-amber-200 bg-amber-50 text-amber-800">
          Future month is view-only. Editing unlocks on {monthStartLabel}.
        </div>
      ) : null}

      <div className="p-2 overflow-hidden glass-panel sm:p-3">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 px-4 py-3 font-semibold text-left bg-white border-b min-w-48 border-slate-200 text-slate-800">
                  Day Status
                </th>
                {monthDays.map((day) => {
                  const status = dayStatus[day.iso] || "active";
                  const skipped = status === "skipped";
                  const dayIsEditable = canEditDate(day.iso);

                  return (
                    <th
                      key={day.iso}
                      className={`border-b border-slate-200 px-2 py-2 text-center ${
                        skipped ? "column-skipped" : "bg-white"
                      }`}
                    >
                      <button
                        disabled={isFutureMonth || !dayIsEditable}
                        onClick={() => {
                          if (!dayIsEditable) {
                            return;
                          }
                          void setDayStatus(day.iso, skipped ? "active" : "skipped");
                        }}
                        className={`w-full rounded-xl px-2 py-2 transition ${
                          skipped
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        } ${isFutureMonth || !dayIsEditable ? "cursor-not-allowed opacity-55 hover:bg-inherit" : ""}`}
                      >
                        <div className="font-semibold">{day.dayNumber}</div>
                        <div className="text-[11px] uppercase tracking-wide">{skipped ? "Skip" : "On"}</div>
                      </button>
                    </th>
                  );
                })}
              </tr>
              <tr>
                <th className="sticky left-0 z-20 min-w-48 border-b border-slate-200 bg-white px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Open Day
                </th>
                {monthDays.map((day) => (
                  <th key={`open-${day.iso}`} className="px-2 py-2 text-center bg-white border-b border-slate-200">
                    <Link
                      to={`/day/${day.iso}`}
                      className="inline-flex px-2 py-1 text-xs font-medium transition rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700"
                    >
                      Open
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.length === 0 ? (
                <tr>
                  <td className="sticky left-0 z-10 px-4 py-6 font-semibold bg-white border-b border-slate-100 text-slate-900">
                    Add habits from Habit Library
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
                    <td className="sticky left-0 z-10 px-4 py-3 font-semibold bg-white border-b border-slate-100 text-slate-900">
                      {habit.name}
                    </td>
                    {monthDays.map((day) => {
                      const dayIsSkipped = (dayStatus[day.iso] || "active") === "skipped";
                      const dayIsEditable = canEditDate(day.iso);
                      const status = entries[day.iso]?.[habit.id] ?? "missed";

                      return (
                        <td
                          key={`${habit.id}-${day.iso}`}
                          className={`border-b border-slate-100 px-2 py-2 text-center ${
                            dayIsSkipped ? "column-skipped" : "bg-white"
                          }`}
                        >
                          <button
                            disabled={dayIsSkipped || isFutureMonth || !dayIsEditable}
                            onClick={() => void setEntry(day.iso, habit.id, status === "done" ? "missed" : "done")}
                            onContextMenu={(event) => {
                              event.preventDefault();
                              if (dayIsSkipped || isFutureMonth || !dayIsEditable) {
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
                                ? "cursor-not-allowed border-rose-200 bg-rose-100 text-rose-600"
                                : "border-slate-200 bg-green-500 text-white hover:-translate-y-px hover:border-blue-300 hover:shadow"
                            } ${!dayIsSkipped && status === "done" ? "border-emerald-600 bg-emerald-600 text-white" : ""}`}
                          >
                            {dayIsSkipped ? (
                              <span className="mx-auto block h-1.5 w-6 rounded-full bg-current" />
                            ) : status === "done" ? (
                              <svg
                                viewBox="0 0 20 20"
                                className="w-4 h-4 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path d="M4 10.5l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-current" />
                            )}
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

      <div className="p-5 space-y-5 glass-panel sm:p-7">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Monthly Analysis ({monthLabel(cursor)})
          </h3>
          <span className="text-xs text-slate-500">Updates instantly from grid changes</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="px-5 py-4 text-white shadow-lg rounded-2xl bg-slate-900 shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Consistency</p>
            <p className="mt-2 text-3xl font-bold">{consistency}%</p>
          </div>
          <div className="px-5 py-4 bg-white border rounded-2xl border-slate-200/70">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Active Days</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{activeDays.length}</p>
          </div>
          <div className="px-5 py-4 bg-white border rounded-2xl border-slate-200/70">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Skipped Days</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{skippedDays}</p>
          </div>
        </div>

        {perHabit.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-2xl border-slate-300 bg-white/70">
            <p className="text-base font-semibold text-slate-700">No habits to analyze</p>
            <p className="mt-1 text-sm text-slate-500">Add habits in Habit Library to see month insights.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {perHabit.map((row) => (
              <div
                key={row.habit.id}
                className="p-4 border rounded-2xl border-slate-200/70 bg-white/80"
              >
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-semibold text-slate-800">{row.habit.name}</span>
                  <span className="text-slate-500">
                    {row.completed}/{row.total} active days
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{row.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {menu ? (
        <div
          className="fixed z-50 min-w-36 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
          style={{ top: menu.y + 8, left: menu.x + 8 }}
        >
          <button
            className="block w-full px-3 py-2 text-sm font-medium text-left rounded-xl text-slate-700 hover:bg-slate-100"
            onClick={() => applyStatus("done")}
          >
            Mark Done
          </button>
          <button
            className="block w-full px-3 py-2 text-sm font-medium text-left rounded-xl text-slate-700 hover:bg-slate-100"
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
