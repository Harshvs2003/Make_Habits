import type { DayStatus } from "../store/useHabitStore.tsx";

type DayStatusToggleProps = {
  value: DayStatus;
  onChange: (status: DayStatus) => void;
  disabled?: boolean;
};

function DayStatusToggle({ value, onChange, disabled = false }: DayStatusToggleProps) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-slate-200/70 bg-slate-100/80 p-1.5">
      <button
        disabled={disabled}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
          value === "active"
            ? "bg-emerald-500 text-white shadow"
            : "text-slate-500 hover:bg-white hover:text-slate-800"
        } ${disabled ? "cursor-not-allowed opacity-55 hover:bg-transparent" : ""}`}
        onClick={() => onChange("active")}
      >
        Active Day
      </button>
      <button
        disabled={disabled}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
          value === "skipped"
            ? "bg-amber-500 text-white shadow"
            : "text-slate-500 hover:bg-white hover:text-slate-800"
        } ${disabled ? "cursor-not-allowed opacity-55 hover:bg-transparent" : ""}`}
        onClick={() => onChange("skipped")}
      >
        Skipped Day
      </button>
    </div>
  );
}

export default DayStatusToggle;
