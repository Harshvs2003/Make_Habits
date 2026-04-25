import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LoadingState from "../components/LoadingState.tsx";
import { getMonthDays, monthLabel } from "../lib/date.tsx";
import { useHabitStore } from "../store/useHabitStore.tsx";

type RangeMode = "all" | "preset" | "custom";

type MonthRange = {
  start: string;
  end: string;
};

const RANGE_MONTH_OPTIONS = [1, 2, 3, 5, 10, 12, 15, 19, 24];
const HABIT_LINE_COLORS = [
  "#10b981",
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#ec4899",
  "#22c55e",
  "#06b6d4",
];

const isMonthKey = (value: string) => /^\d{4}-\d{2}$/.test(value);

const keyFromDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthDateFromKey = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

const shiftMonthKey = (key: string, delta: number) => {
  const base = monthDateFromKey(key);
  base.setMonth(base.getMonth() + delta);
  return keyFromDate(base);
};

const clampMonthKey = (value: string, min: string, max: string) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const listMonthsInRange = (start: string, end: string) => {
  const result: string[] = [];
  let pointer = start;

  while (pointer <= end) {
    result.push(pointer);
    pointer = shiftMonthKey(pointer, 1);
  }

  return result;
};

const monthAxisLabel = (key: string) => monthDateFromKey(key).toLocaleString("en-US", { month: "short", year: "2-digit" });

const resolveRange = ({
  mode,
  presetMonths,
  from,
  to,
  earliest,
  latest,
}: {
  mode: RangeMode;
  presetMonths: number;
  from: string;
  to: string;
  earliest: string;
  latest: string;
}): MonthRange | null => {
  if (!earliest || !latest) return null;

  let start = earliest;
  let end = latest;

  if (mode === "preset") {
    start = shiftMonthKey(latest, -(presetMonths - 1));
    start = clampMonthKey(start, earliest, latest);
  }

  if (mode === "custom") {
    start = isMonthKey(from) ? from : earliest;
    end = isMonthKey(to) ? to : latest;

    start = clampMonthKey(start, earliest, latest);
    end = clampMonthKey(end, earliest, latest);

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }
  }

  return { start, end };
};

function MonthPage() {
  const [cursor, setCursor] = useState(() => {
    const base = new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const [overallMode, setOverallMode] = useState<RangeMode>("all");
  const [overallPresetMonths, setOverallPresetMonths] = useState(12);
  const [overallFromMonth, setOverallFromMonth] = useState("");
  const [overallToMonth, setOverallToMonth] = useState("");

  const [habitMode, setHabitMode] = useState<RangeMode>("preset");
  const [habitPresetMonths, setHabitPresetMonths] = useState(1);
  const [habitFromMonth, setHabitFromMonth] = useState("");
  const [habitToMonth, setHabitToMonth] = useState("");

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

  const joinedMonthKey = useMemo(() => {
    const monthKeys = Object.keys(entries)
      .map((date) => date.slice(0, 7))
      .filter((key) => isMonthKey(key))
      .sort();

    return monthKeys[0] || "";
  }, [entries]);

  const currentMonthKey = useMemo(() => keyFromDate(new Date()), []);

  const overallRange = useMemo(
    () =>
      resolveRange({
        mode: overallMode,
        presetMonths: overallPresetMonths,
        from: overallFromMonth,
        to: overallToMonth,
        earliest: joinedMonthKey,
        latest: currentMonthKey,
      }),
    [overallMode, overallPresetMonths, overallFromMonth, overallToMonth, joinedMonthKey, currentMonthKey]
  );

  const habitRange = useMemo(
    () =>
      resolveRange({
        mode: habitMode,
        presetMonths: habitPresetMonths,
        from: habitFromMonth,
        to: habitToMonth,
        earliest: joinedMonthKey,
        latest: currentMonthKey,
      }),
    [habitMode, habitPresetMonths, habitFromMonth, habitToMonth, joinedMonthKey, currentMonthKey]
  );

  const monthlyTrendData = useMemo(() => {
    if (habits.length === 0 || !overallRange) return [];

    const monthKeys = listMonthsInRange(overallRange.start, overallRange.end);

    return monthKeys.map((monthKey) => {
      const monthDays = getMonthDays(monthDateFromKey(monthKey));
      const activeMonthDays = monthDays.filter((day) => (dayStatus[day.iso] || "active") === "active");
      const total = activeMonthDays.length * habits.length;

      let completed = 0;
      activeMonthDays.forEach((day) => {
        habits.forEach((habit) => {
          if (entries[day.iso]?.[habit.id] === "done") {
            completed += 1;
          }
        });
      });

      return {
        month: monthAxisLabel(monthKey),
        monthKey,
        value: total ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [entries, dayStatus, habits, overallRange]);

  const habitColorMap = useMemo(
    () => Object.fromEntries(habits.map((habit, index) => [habit.id, HABIT_LINE_COLORS[index % HABIT_LINE_COLORS.length]])),
    [habits]
  );

  const perHabitTrendData = useMemo(() => {
    if (habits.length === 0 || !habitRange) return [];

    const monthKeys = listMonthsInRange(habitRange.start, habitRange.end);

    return monthKeys.map((monthKey) => {
      const monthDays = getMonthDays(monthDateFromKey(monthKey));
      const activeMonthDays = monthDays.filter((day) => (dayStatus[day.iso] || "active") === "active");
      const row: Record<string, string | number> = {
        month: monthAxisLabel(monthKey),
        monthKey,
      };

      habits.forEach((habit) => {
        const completed = activeMonthDays.filter((day) => entries[day.iso]?.[habit.id] === "done").length;
        const total = activeMonthDays.length;
        row[habit.id] = total ? Math.round((completed / total) * 100) : 0;
      });

      return row;
    });
  }, [entries, dayStatus, habits, habitRange]);

  const highestHabitPoint = useMemo<{ month: string; value: number; habitId: string } | null>(() => {
    let peak: { month: string; value: number; habitId: string } | null = null;

    perHabitTrendData.forEach((row) => {
      habits.forEach((habit) => {
        const score = row[habit.id];
        if (typeof score !== "number") return;

        if (!peak || score > peak.value) {
          peak = {
            month: String(row.month),
            value: score,
            habitId: habit.id,
          };
        }
      });
    });

    return peak;
  }, [perHabitTrendData, habits]);

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
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Best Performer</p>
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
              <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600">{row.percent}%</span>
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

      <div className="space-y-3">
        <div className="px-1">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Progress Charts</h3>
          <p className="mt-1 text-xs text-slate-500">Swipe horizontally to switch between chart views.</p>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex snap-x snap-mandatory gap-4">
            <div className="glass-panel min-w-full snap-start space-y-5 p-5 sm:p-7">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Range</label>
                  <select
                    value={overallMode}
                    onChange={(event) => setOverallMode(event.target.value as RangeMode)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <option value="all">Since Joined</option>
                    <option value="preset">Last N Months</option>
                    <option value="custom">Custom From-To</option>
                  </select>
                </div>

                {overallMode === "preset" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Months</label>
                    <select
                      value={overallPresetMonths}
                      onChange={(event) => setOverallPresetMonths(Number(event.target.value))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      {RANGE_MONTH_OPTIONS.map((months) => (
                        <option key={months} value={months}>
                          {months} months
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {overallMode === "custom" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">From</label>
                      <input
                        type="month"
                        value={overallFromMonth}
                        min={joinedMonthKey || undefined}
                        max={currentMonthKey}
                        onChange={(event) => setOverallFromMonth(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">To</label>
                      <input
                        type="month"
                        value={overallToMonth}
                        min={joinedMonthKey || undefined}
                        max={currentMonthKey}
                        onChange={(event) => setOverallToMonth(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      />
                    </div>
                  </>
                ) : null}
              </div>

              {monthlyTrendData.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                  <p className="text-base font-semibold text-slate-700">No yearly trend data yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Start tracking habits to see monthly consistency over time.
                  </p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value ?? 0}% consistency`} />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="glass-panel min-w-full snap-start space-y-5 p-5 sm:p-7">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Range</label>
                  <select
                    value={habitMode}
                    onChange={(event) => setHabitMode(event.target.value as RangeMode)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <option value="preset">Current/Last N Months</option>
                    <option value="all">Since Joined</option>
                    <option value="custom">Custom From-To</option>
                  </select>
                </div>

                {habitMode === "preset" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Months</label>
                    <select
                      value={habitPresetMonths}
                      onChange={(event) => setHabitPresetMonths(Number(event.target.value))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      {RANGE_MONTH_OPTIONS.map((months) => (
                        <option key={months} value={months}>
                          {months} months
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {habitMode === "custom" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">From</label>
                      <input
                        type="month"
                        value={habitFromMonth}
                        min={joinedMonthKey || undefined}
                        max={currentMonthKey}
                        onChange={(event) => setHabitFromMonth(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">To</label>
                      <input
                        type="month"
                        value={habitToMonth}
                        min={joinedMonthKey || undefined}
                        max={currentMonthKey}
                        onChange={(event) => setHabitToMonth(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      />
                    </div>
                  </>
                ) : null}
              </div>

              {perHabitTrendData.length === 0 || habits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                  <p className="text-base font-semibold text-slate-700">No habit trend data yet</p>
                  <p className="mt-1 text-sm text-slate-500">Track habits for this range to unlock the multi-line chart.</p>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={perHabitTrendData}>
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value ?? 0}% consistency`} />
                      <Legend />

                      {habits.map((habit) => (
                        <Line
                          key={habit.id}
                          type="monotone"
                          dataKey={habit.id}
                          name={habit.name}
                          stroke={habitColorMap[habit.id] as string}
                          strokeWidth={2.5}
                          dot={{ r: 2.5 }}
                        />
                      ))}

                      {highestHabitPoint ? (
                        <ReferenceDot
                          x={highestHabitPoint.month}
                          y={highestHabitPoint.value}
                          r={6}
                          fill="#ffffff"
                          stroke={habitColorMap[highestHabitPoint.habitId] as string}
                          strokeWidth={2}
                          ifOverflow="visible"
                        />
                      ) : null}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MonthPage;

