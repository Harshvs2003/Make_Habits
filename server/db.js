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
const subscriptionsCollection = () => db.collection("subscriptions");

const DEFAULT_SUBSCRIPTION = {
  plan: "free",
  status: "active",
  habitLimit: 5,
  adsEnabled: true,
};

const keyPatternEquals = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const dropLegacyUniqueIndexes = async (collection, legacyKeyPatterns) => {
  const indexes = await collection.indexes();

  for (const index of indexes) {
    if (!index?.name || index.name === "_id_" || !index.unique) {
      continue;
    }

    const isLegacy = legacyKeyPatterns.some((pattern) => keyPatternEquals(index.key, pattern));
    if (!isLegacy) {
      continue;
    }

    await collection.dropIndex(index.name);
  }
};

const initDb = async () => {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
  }

  await Promise.all([
    // Pre-multi-user schema legacy unique indexes that cause cross-user collisions.
    dropLegacyUniqueIndexes(habitsCollection(), [{ id: 1 }, { normalizedName: 1 }]),
    dropLegacyUniqueIndexes(entriesCollection(), [{ date: 1 }]),
    dropLegacyUniqueIndexes(dayStatusCollection(), [{ date: 1 }]),
  ]);

  await Promise.all([
    habitsCollection().createIndex({ uid: 1, id: 1 }, { unique: true }),
    habitsCollection().createIndex({ uid: 1, normalizedName: 1 }, { unique: true }),
    entriesCollection().createIndex({ uid: 1, date: 1 }, { unique: true }),
    dayStatusCollection().createIndex({ uid: 1, date: 1 }, { unique: true }),
    subscriptionsCollection().createIndex({ uid: 1 }, { unique: true }),
  ]);
};

const getHabits = async (uid) => {
  const docs = await habitsCollection()
    .find({ uid })
    .sort({ createdAt: 1 })
    .project({ _id: 0, id: 1, name: 1, createdAt: 1 })
    .toArray();

  return docs;
};

const countHabits = async (uid) => habitsCollection().countDocuments({ uid });

const createHabit = async (uid, habit) => {
  const doc = {
    uid,
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

const deleteHabit = async (uid, id) => {
  const result = await habitsCollection().deleteOne({ uid, id });

  if (result.deletedCount > 0) {
    await entriesCollection().updateMany({ uid }, { $unset: { [`values.${id}`]: "" } });
  }

  return result.deletedCount > 0;
};

const habitExists = async (uid, id) => {
  const doc = await habitsCollection().findOne({ uid, id }, { projection: { _id: 1 } });
  return !!doc;
};

const getEntries = async (uid) => {
  const docs = await entriesCollection()
    .find({ uid })
    .project({ _id: 0, date: 1, values: 1 })
    .toArray();

  return docs.reduce((acc, doc) => {
    acc[doc.date] = doc.values || {};
    return acc;
  }, {});
};

const setEntry = async (uid, { date, habitId, status }) => {
  await entriesCollection().updateOne(
    { uid, date },
    { $set: { [`values.${habitId}`]: status } },
    { upsert: true }
  );
};

const getDayStatusForDate = async (uid, date) => {
  const doc = await dayStatusCollection().findOne(
    { uid, date },
    { projection: { _id: 0, status: 1 } }
  );
  return doc?.status || "active";
};

const getAllDayStatus = async (uid) => {
  const docs = await dayStatusCollection()
    .find({ uid })
    .project({ _id: 0, date: 1, status: 1 })
    .toArray();

  return docs.reduce((acc, doc) => {
    acc[doc.date] = doc.status;
    return acc;
  }, {});
};

const setDayStatus = async (uid, { date, status }) => {
  await dayStatusCollection().updateOne(
    { uid, date },
    { $set: { status } },
    { upsert: true }
  );
};

const getSubscription = async (uid) => {
  const existing = await subscriptionsCollection().findOne(
    { uid },
    { projection: { _id: 0, uid: 0 } }
  );

  if (existing) {
    return {
      ...DEFAULT_SUBSCRIPTION,
      ...existing,
    };
  }

  await subscriptionsCollection().updateOne(
    { uid },
    {
      $setOnInsert: {
        uid,
        ...DEFAULT_SUBSCRIPTION,
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  return { ...DEFAULT_SUBSCRIPTION };
};

const upsertSubscription = async (uid, data) => {
  const next = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await subscriptionsCollection().updateOne(
    { uid },
    {
      $set: next,
      $setOnInsert: {
        uid,
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  return getSubscription(uid);
};

module.exports = {
  initDb,
  getHabits,
  countHabits,
  createHabit,
  deleteHabit,
  habitExists,
  getEntries,
  setEntry,
  getDayStatusForDate,
  getAllDayStatus,
  setDayStatus,
  getSubscription,
  upsertSubscription,
};
