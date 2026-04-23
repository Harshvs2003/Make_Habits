function LoadingState({ label = "Loading HabitFlow..." }: { label?: string }) {
  return (
    <div className="glass-panel flex items-center gap-4 p-6 text-slate-600">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">Preparing your dashboard</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default LoadingState;