import type { EntryStatus } from "../store/useHabitStore.tsx";

type HabitCheckButtonProps = {
  status: EntryStatus;
  disabled?: boolean;
  onToggleDone: () => void;
};

function HabitCheckButton({
  status,
  disabled = false,
  onToggleDone,
}: HabitCheckButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={() => {
        console.log("BEFORE CLICK:", status);
        onToggleDone();
      }}
      className={`grid h-12 w-12 place-items-center rounded-2xl border text-lg font-bold transition-all duration-200 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : "cursor-pointer border-blue-200 bg-white text-slate-500 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow active:translate-y-0"
      } ${status === "done" ? "animate-pulseScale border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/30" : ""}`}
      aria-label="Toggle habit done status"
    >
      {status === "done" ? (
        <svg
          viewBox="0 0 20 20"
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            d="M4 10.5l4 4 8-8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span className="block h-3.5 w-3.5 rounded-full border-2 border-current" />
      )}
    </button>
  );
}

export default HabitCheckButton;
