require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");

const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, "data.json");
const clientOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

const isLocalhostOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch (_error) {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      const allowAllConfigured = clientOrigins.length === 0;

      if (!origin || allowAllConfigured || clientOrigins.includes(origin) || isLocalhostOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS blocked: origin not allowed"));
    },
  })
);
app.use(express.json());

let writeQueue = Promise.resolve();

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isEntryStatus = (value) => ["done", "skipped", "missed"].includes(value);
const isDayStatus = (value) => ["active", "skipped"].includes(value);

const readData = async () => {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
};

const writeData = async (nextData) => {
  writeQueue = writeQueue.then(() =>
    fs.writeFile(DATA_FILE, JSON.stringify(nextData, null, 2), "utf8")
  );
  await writeQueue;
};

const sanitize = (data) => ({
  habits: Array.isArray(data.habits) ? data.habits : [],
  entries: data.entries && typeof data.entries === "object" ? data.entries : {},
  dayStatus: data.dayStatus && typeof data.dayStatus === "object" ? data.dayStatus : {},
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/habits", async (_req, res) => {
  try {
    const data = sanitize(await readData());
    res.json(data.habits);
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

    const data = sanitize(await readData());
    const trimmedName = name.trim();

    const alreadyExists = data.habits.some(
      (habit) => habit.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      res.status(409).json({ message: "Habit already exists." });
      return;
    }

    const habit = {
      id: `habit-${Date.now()}`,
      name: trimmedName,
      createdAt: new Date().toISOString(),
    };

    data.habits.push(habit);
    await writeData(data);

    res.status(201).json(habit);
  } catch (_error) {
    res.status(500).json({ message: "Failed to create habit." });
  }
});

app.get("/entries", async (_req, res) => {
  try {
    const data = sanitize(await readData());
    res.json(data.entries);
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

    const data = sanitize(await readData());
    const habitExists = data.habits.some((habit) => habit.id === habitId);

    if (!habitExists) {
      res.status(404).json({ message: "Habit not found." });
      return;
    }

    if (!data.entries[date]) {
      data.entries[date] = {};
    }

    data.entries[date][habitId] = status;
    await writeData(data);

    res.status(201).json({ date, habitId, status });
  } catch (_error) {
    res.status(500).json({ message: "Failed to save entry." });
  }
});

app.get("/day-status", async (req, res) => {
  try {
    const data = sanitize(await readData());
    const date = req.query.date;

    if (typeof date === "string") {
      if (!isIsoDate(date)) {
        res.status(400).json({ message: "A valid date (YYYY-MM-DD) is required." });
        return;
      }

      res.json({ date, status: data.dayStatus[date] || "active" });
      return;
    }

    res.json(data.dayStatus);
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

    const data = sanitize(await readData());
    data.dayStatus[date] = status;
    await writeData(data);

    res.status(201).json({ date, status });
  } catch (_error) {
    res.status(500).json({ message: "Failed to save day status." });
  }
});

app.listen(PORT, () => {
  console.log(`HabitFlow API running on http://localhost:${PORT}`);
});