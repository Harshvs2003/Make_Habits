require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const {
  initDb,
  createHabit,
  setEntry,
  setDayStatus,
} = require("./db");

const DATA_FILE = path.join(__dirname, "data.json");
const isEntryStatus = (value) => ["done", "skipped", "missed"].includes(value);
const isDayStatus = (value) => ["active", "skipped"].includes(value);
const migrationUid = (process.env.MIGRATION_UID || "legacy-import-user").trim();

const run = async () => {
  await initDb();

  let raw;
  try {
    raw = await fs.readFile(DATA_FILE, "utf8");
  } catch (_error) {
    console.log("No data.json found. Skipping migration.");
    return;
  }

  const parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
  const habits = Array.isArray(parsed.habits) ? parsed.habits : [];
  const entries = parsed.entries && typeof parsed.entries === "object" ? parsed.entries : {};
  const dayStatus = parsed.dayStatus && typeof parsed.dayStatus === "object" ? parsed.dayStatus : {};

  for (const habit of habits) {
    if (!habit?.id || !habit?.name) {
      continue;
    }

    try {
      await createHabit(migrationUid, {
        id: habit.id,
        name: habit.name,
        createdAt: habit.createdAt || new Date().toISOString(),
      });
    } catch (error) {
      if (error && error.code === 11000) {
        continue;
      }
      throw error;
    }
  }

  for (const [date, values] of Object.entries(entries)) {
    if (!values || typeof values !== "object") {
      continue;
    }

    for (const [habitId, status] of Object.entries(values)) {
      if (!habitId || !isEntryStatus(status)) {
        continue;
      }
      await setEntry(migrationUid, { date, habitId, status });
    }
  }

  for (const [date, status] of Object.entries(dayStatus)) {
    if (!isDayStatus(status)) {
      continue;
    }
    await setDayStatus(migrationUid, { date, status });
  }

  console.log(`Migration complete for uid ${migrationUid}: data.json -> MongoDB`);
};

run().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
