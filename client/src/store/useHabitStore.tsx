import { create } from "zustand";
import { api } from "../lib/api.tsx";

export type Habit = {
  id: string;
  name: string;
  createdAt: string;
};

export type EntryStatus = "done" | "skipped" | "missed";
export type DayStatus = "active" | "skipped";

type HabitStore = {
  habits: Habit[];
  entries: Record<string, Record<string, EntryStatus>>;
  dayStatus: Record<string, DayStatus>;
  loading: boolean;
  saving: boolean;
  error: string;
  hydrate: () => Promise<void>;
  addHabit: (name: string) => Promise<void>;
  setEntry: (date: string, habitId: string, status: EntryStatus) => Promise<void>;
  setDayStatus: (date: string, status: DayStatus) => Promise<void>;
};

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  entries: {},
  dayStatus: {},
  loading: true,
  saving: false,
  error: "",

  hydrate: async () => {
    set({ loading: true, error: "" });
    try {
      const [habits, entries, dayStatus] = await Promise.all([
        api.getHabits(),
        api.getEntries(),
        api.getDayStatus(),
      ]);

      set({ habits, entries, dayStatus, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load data.",
      });
    }
  },

  addHabit: async (name) => {
    set({ saving: true, error: "" });
    try {
      const habit = await api.createHabit(name);
      set((state) => ({
        habits: [...state.habits, habit],
        saving: false,
      }));
    } catch (error) {
      set({
        saving: false,
        error: error instanceof Error ? error.message : "Failed to add habit.",
      });
    }
  },

  setEntry: async (date, habitId, status) => {
    const previous = get().entries;

    set((state) => ({
      saving: true,
      error: "",
      entries: {
        ...state.entries,
        [date]: {
          ...(state.entries[date] || {}),
          [habitId]: status,
        },
      },
    }));

    try {
      await api.setEntry(date, habitId, status);
      set({ saving: false });
    } catch (error) {
      set({
        entries: previous,
        saving: false,
        error: error instanceof Error ? error.message : "Failed to save habit status.",
      });
    }
  },

  setDayStatus: async (date, status) => {
    const previous = get().dayStatus;

    set((state) => ({
      saving: true,
      error: "",
      dayStatus: {
        ...state.dayStatus,
        [date]: status,
      },
    }));

    try {
      await api.setDayStatus(date, status);
      set({ saving: false });
    } catch (error) {
      set({
        dayStatus: previous,
        saving: false,
        error: error instanceof Error ? error.message : "Failed to save day status.",
      });
    }
  },
}));