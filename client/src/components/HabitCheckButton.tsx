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
      className={`grid h-12 w-12 place-items-center rounded-xl border-0 text-sm font-semibold transition-all duration-150 ${
        disabled
          ? "cursor-not-allowed bg-slate-200 text-slate-400"
          : "cursor-pointer bg-blue-50 text-blue-700 hover:scale-105 hover:bg-blue-100 active:scale-95"
      } ${status === "done" ? "animate-pulseScale bg-blue-600 text-white" : ""}`}
      aria-label="Toggle habit done status"
    >
      {status === "done" ? "OK" : "[]"}
    </button>
  );
}

export default HabitCheckButton;