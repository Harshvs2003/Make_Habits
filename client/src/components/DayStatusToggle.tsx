import type { DayStatus } from "../store/useHabitStore.tsx";

type DayStatusToggleProps = {
  value: DayStatus;
  onChange: (status: DayStatus) => void;
};

function DayStatusToggle({ value, onChange }: DayStatusToggleProps) {
  return (
    <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
      <button
        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
          value === "active"
            ? "bg-white text-emerald-700 shadow"
            : "text-slate-500 hover:text-slate-700"
        }`}
        onClick={() => onChange("active")}
      >
        Active Day
      </button>
      <button
        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
          value === "skipped"
            ? "bg-white text-amber-700 shadow"
            : "text-slate-500 hover:text-slate-700"
        }`}
        onClick={() => onChange("skipped")}
      >
        Skipped Day
      </button>
    </div>
  );
}

export default DayStatusToggle;
