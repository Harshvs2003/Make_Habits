import { useRef } from "react";
import type { EntryStatus } from "../store/useHabitStore.tsx";

type HabitCheckButtonProps = {
  status: EntryStatus;
  disabled?: boolean;
  onToggleDone: () => void;
};

function HabitCheckButton({ status, disabled = false, onToggleDone }: HabitCheckButtonProps) {
  const timerRef = useRef<number | null>(null);
  const longPressRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <button
      disabled={disabled}
      onClick={() => {
        if (longPressRef.current) {
          longPressRef.current = false;
          return;
        }
        onToggleDone();
      }}
      onPointerDown={() => {
        longPressRef.current = false;
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          longPressRef.current = true;
          onToggleDone();
        }, 450);
      }}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      className={`grid h-12 w-12 place-items-center rounded-2xl border text-lg font-bold transition-all duration-200 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : "cursor-pointer border-blue-200 bg-white text-slate-500 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow active:translate-y-0"
      } ${status === "done" ? "animate-pulseScale border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/30" : ""}`}
      aria-label="Toggle habit done status"
    >
      {status === "done" ? "✓" : "○"}
    </button>
  );
}

export default HabitCheckButton;