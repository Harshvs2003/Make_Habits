require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  initDb,
  getHabits,
  createHabit,
  deleteHabit,
  habitExists,
  getEntries,
  setEntry,
  getDayStatusForDate,
  getAllDayStatus,
  setDayStatus,
} = require("./db");

const PORT = process.env.PORT || 4000;
const normalizeOrigin = (origin) => origin.replace(/\/$/, "");
const clientOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);
const exactClientOrigins = clientOrigins.filter((origin) => !origin.includes("*"));
const wildcardClientOriginPatterns = clientOrigins
  .filter((origin) => origin.includes("*"))
  .map((origin) => {
    const escaped = origin.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`);
  });

const app = express();

const isLocalhostOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch (_error) {
    return false;
  }
};

const isAllowedClientOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (exactClientOrigins.includes(normalizedOrigin)) {
    return true;
  }

  return wildcardClientOriginPatterns.some((pattern) => pattern.test(normalizedOrigin));
};

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isEntryStatus = (value) => ["done", "skipped", "missed"].includes(value);
const isDayStatus = (value) => ["active", "skipped"].includes(value);
const isFutureMonthDate = (value) => {
  const [year, month] = value.split("-").map(Number);
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month - 1 > now.getMonth());
};

app.use(
  cors({
    origin(origin, callback) {
      const allowAllConfigured = clientOrigins.length === 0;

      if (
        !origin ||
        allowAllConfigured ||
        isAllowedClientOrigin(origin) ||
        isLocalhostOrigin(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked: origin not allowed (${origin})`));
    },
  })
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await initDb();
    res.json({ status: "ok" });
  } catch (_error) {
    res.status(500).json({ status: "error" });
  }
});

app.get("/habits", async (_req, res) => {
  try {
    const habits = await getHabits();
    res.json(habits);
  } catch (_error) {
    res.status(500).json({ message: "Failed to read habits." });
  }
});

app.post("/habits", async (req, res) => {
  try {
    const { name } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ message: "Habit name is required." });
      return;
    }

    const trimmedName = name.trim();

    const habit = await createHabit({
      id: `habit-${Date.now()}`,
      name: trimmedName,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(habit);
  } catch (error) {
    if (error && error.code === 11000) {
      res.status(409).json({ message: "Habit already exists." });
      return;
    }
    res.status(500).json({ message: "Failed to create habit." });
  }
});

app.delete("/habits/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await deleteHabit(id);

    if (!removed) {
      res.status(404).json({ message: "Habit not found." });
      return;
    }

    res.json({ id });
  } catch (_error) {
    res.status(500).json({ message: "Failed to delete habit." });
  }
});

app.get("/entries", async (_req, res) => {
  try {
    const entries = await getEntries();
    res.json(entries);
  } catch (_error) {
    res.status(500).json({ message: "Failed to read entries." });
  }
});

app.post("/entries", async (req, res) => {
  try {
    const { date, habitId, status } = req.body || {};

    if (!isIsoDate(date)) {
      res.status(400).json({ message: "A valid date (YYYY-MM-DD) is required." });
      return;
    }

    if (!habitId || typeof habitId !== "string") {
      res.status(400).json({ message: "habitId is required." });
      return;
    }

    if (!isEntryStatus(status)) {
      res.status(400).json({ message: "status must be done, skipped, or missed." });
      return;
    }

    if (isFutureMonthDate(date)) {
      res.status(403).json({ message: "Future month is locked until it starts." });
      return;
    }

    const exists = await habitExists(habitId);
    if (!exists) {
      res.status(404).json({ message: "Habit not found." });
      return;
    }

    await setEntry({ date, habitId, status });
    res.status(201).json({ date, habitId, status });
  } catch (_error) {
    res.status(500).json({ message: "Failed to save entry." });
  }
});

app.get("/day-status", async (req, res) => {
  try {
    const date = req.query.date;

    if (typeof date === "string") {
      if (!isIsoDate(date)) {
        res.status(400).json({ message: "A valid date (YYYY-MM-DD) is required." });
        return;
      }

      const status = await getDayStatusForDate(date);
      res.json({ date, status });
      return;
    }

    const dayStatus = await getAllDayStatus();
    res.json(dayStatus);
  } catch (_error) {
    res.status(500).json({ message: "Failed to read day status." });
  }
});

app.post("/day-status", async (req, res) => {
  try {
    const { date, status } = req.body || {};

    if (!isIsoDate(date)) {
      res.status(400).json({ message: "A valid date (YYYY-MM-DD) is required." });
      return;
    }

    if (!isDayStatus(status)) {
      res.status(400).json({ message: "status must be active or skipped." });
      return;
    }

    if (isFutureMonthDate(date)) {
      res.status(403).json({ message: "Future month is locked until it starts." });
      return;
    }

    await setDayStatus({ date, status });
    res.status(201).json({ date, status });
  } catch (_error) {
    res.status(500).json({ message: "Failed to save day status." });
  }
});

const start = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`HabitFlow API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start();
