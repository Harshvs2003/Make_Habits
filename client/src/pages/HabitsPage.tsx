import { useState, type FormEvent } from "react";
import LoadingState from "../components/LoadingState.tsx";
import { useHabitStore } from "../store/useHabitStore.tsx";

function HabitsPage() {
  const [habitName, setHabitName] = useState("");
  const { habits, loading, saving, error, addHabit, deleteHabit } = useHabitStore();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!habitName.trim()) {
      return;
    }

    await addHabit(habitName);
    setHabitName("");
  };

  if (loading) {
    return <LoadingState label="Loading habits..." />;
  }

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-5 p-5 sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Habit Library</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Manage Habits</h2>
          <p className="mt-1 text-sm text-slate-500">Create and maintain your master habit list in one place.</p>
        </div>

        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
          <input
            type="text"
            value={habitName}
            onChange={(event) => setHabitName(event.target.value)}
            placeholder="Add a new habit"
            className="input-premium"
          />
          <button type="submit" className="primary-button sm:min-w-28">
            Add Habit
          </button>
        </form>
        {saving ? <p className="text-xs text-slate-500">Saving changes...</p> : null}
        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      </div>

      <div className="glass-panel p-4 sm:p-5">
        {habits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
            <p className="text-base font-semibold text-slate-700">No habits yet</p>
            <p className="mt-1 text-sm text-slate-500">Add your first habit above.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {habits.map((habit) => (
              <li
                key={habit.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">{habit.name}</p>
                  <p className="text-xs text-slate-500">Used across Today, Month, Day Details, and Grid.</p>
                </div>
                <button
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  onClick={() => void deleteHabit(habit.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default HabitsPage;