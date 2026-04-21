function LoadingState({ label = "Loading HabitFlow..." }: { label?: string }) {
  return (
    <div className="glass-panel flex items-center gap-3 p-6 text-slate-600">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default LoadingState;