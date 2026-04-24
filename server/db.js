const { MongoClient } = require("mongodb");

const mongoUri = (process.env.MONGODB_URI || "").trim();
const dbName = (process.env.MONGODB_DB_NAME || "habitflow").trim();

if (!mongoUri) {
  throw new Error("MONGODB_URI is required.");
}

const client = new MongoClient(mongoUri);
let db;

const habitsCollection = () => db.collection("habits");
const entriesCollection = () => db.collection("entries");
const dayStatusCollection = () => db.collection("day_status");

const initDb = async () => {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
  }

  await Promise.all([
    habitsCollection().createIndex({ id: 1 }, { unique: true }),
    habitsCollection().createIndex({ normalizedName: 1 }, { unique: true }),
    entriesCollection().createIndex({ date: 1 }, { unique: true }),
    dayStatusCollection().createIndex({ date: 1 }, { unique: true }),
  ]);
};

const getHabits = async () => {
  const docs = await habitsCollection()
    .find({})
    .sort({ createdAt: 1 })
    .project({ _id: 0, id: 1, name: 1, createdAt: 1 })
    .toArray();

  return docs;
};

const createHabit = async (habit) => {
  const doc = {
    id: habit.id,
    name: habit.name,
    normalizedName: habit.name.toLowerCase(),
    createdAt: habit.createdAt,
  };

  await habitsCollection().insertOne(doc);

  return {
    id: doc.id,
    name: doc.name,
    createdAt: doc.createdAt,
  };
};

const deleteHabit = async (id) => {
  const result = await habitsCollection().deleteOne({ id });

  if (result.deletedCount > 0) {
    await entriesCollection().updateMany({}, { $unset: { [`values.${id}`]: "" } });
  }

  return result.deletedCount > 0;
};

const habitExists = async (id) => {
  const doc = await habitsCollection().findOne({ id }, { projection: { _id: 1 } });
  return !!doc;
};

const getEntries = async () => {
  const docs = await entriesCollection()
    .find({})
    .project({ _id: 0, date: 1, values: 1 })
    .toArray();

  return docs.reduce((acc, doc) => {
    acc[doc.date] = doc.values || {};
    return acc;
  }, {});
};

const setEntry = async ({ date, habitId, status }) => {
  await entriesCollection().updateOne(
    { date },
    { $set: { [`values.${habitId}`]: status } },
    { upsert: true }
  );
};

const getDayStatusForDate = async (date) => {
  const doc = await dayStatusCollection().findOne(
    { date },
    { projection: { _id: 0, status: 1 } }
  );
  return doc?.status || "active";
};

const getAllDayStatus = async () => {
  const docs = await dayStatusCollection()
    .find({})
    .project({ _id: 0, date: 1, status: 1 })
    .toArray();

  return docs.reduce((acc, doc) => {
    acc[doc.date] = doc.status;
    return acc;
  }, {});
};

const setDayStatus = async ({ date, status }) => {
  await dayStatusCollection().updateOne(
    { date },
    { $set: { status } },
    { upsert: true }
  );
};

module.exports = {
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
};
