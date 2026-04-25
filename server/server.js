require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const {
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
} = require("./db");
const { requireAuth } = require("./auth");
const { getPlanConfig, buildSubscriptionFromPlan, publicPlans } = require("./plans");

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

const razorpayKeyId = (process.env.RAZORPAY_KEY_ID || "").trim();
const razorpayKeySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
const razorpayCurrency = (process.env.RAZORPAY_CURRENCY || "INR").trim();
const razorpayEnabled = !!(razorpayKeyId && razorpayKeySecret);
const razorpay = razorpayEnabled
  ? new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })
  : null;

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
    res.json({ status: "ok", razorpayEnabled });
  } catch (_error) {
    res.status(500).json({ status: "error" });
  }
});

app.get("/plans", (_req, res) => {
  res.json(publicPlans());
});

app.use(requireAuth);

app.get("/auth/me", async (req, res) => {
  try {
    const subscription = await getSubscription(req.user.uid);
    res.json({
      user: {
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
      },
      subscription,
    });
  } catch (_error) {
    res.status(500).json({ message: "Failed to load user profile." });
  }
});

app.get("/habits", async (req, res) => {
  try {
    const habits = await getHabits(req.user.uid);
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

    const currentSubscription = await getSubscription(req.user.uid);
    const habitLimit = currentSubscription.habitLimit;

    if (typeof habitLimit === "number") {
      const totalHabits = await countHabits(req.user.uid);
      if (totalHabits >= habitLimit) {
        res.status(403).json({
          message: `Habit limit reached for ${currentSubscription.plan} plan. Upgrade to add more habits.`,
          code: "HABIT_LIMIT_REACHED",
          habitLimit,
        });
        return;
      }
    }

    const trimmedName = name.trim();

    const habit = await createHabit(req.user.uid, {
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
    const removed = await deleteHabit(req.user.uid, id);

    if (!removed) {
      res.status(404).json({ message: "Habit not found." });
      return;
    }

    res.json({ id });
  } catch (_error) {
    res.status(500).json({ message: "Failed to delete habit." });
  }
});

app.get("/entries", async (req, res) => {
  try {
    const entries = await getEntries(req.user.uid);
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

    const exists = await habitExists(req.user.uid, habitId);
    if (!exists) {
      res.status(404).json({ message: "Habit not found." });
      return;
    }

    await setEntry(req.user.uid, { date, habitId, status });
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

      const status = await getDayStatusForDate(req.user.uid, date);
      res.json({ date, status });
      return;
    }

    const dayStatus = await getAllDayStatus(req.user.uid);
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

    await setDayStatus(req.user.uid, { date, status });
    res.status(201).json({ date, status });
  } catch (_error) {
    res.status(500).json({ message: "Failed to save day status." });
  }
});

app.post("/billing/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      res.status(503).json({ message: "Payments are not configured on server." });
      return;
    }

    const { plan } = req.body || {};
    if (plan !== "pro" && plan !== "premium") {
      res.status(400).json({ message: "Plan must be pro or premium." });
      return;
    }

    const config = getPlanConfig(plan);
    const amountInPaise = Math.round(config.priceInr * 100);

    if (!amountInPaise || amountInPaise <= 0) {
      res.status(400).json({ message: "Invalid plan amount configuration." });
      return;
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: razorpayCurrency,
      receipt: `receipt_${req.user.uid}_${Date.now()}`,
      notes: {
        uid: req.user.uid,
        plan,
      },
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      plan,
    });
  } catch (_error) {
    res.status(500).json({ message: "Failed to create payment order." });
  }
});

app.post("/billing/verify-payment", async (req, res) => {
  try {
    const { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (plan !== "pro" && plan !== "premium") {
      res.status(400).json({ message: "Plan must be pro or premium." });
      return;
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ message: "Missing payment verification details." });
      return;
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ message: "Payment signature mismatch." });
      return;
    }

    const subscriptionPayload = buildSubscriptionFromPlan(plan);
    const subscription = await upsertSubscription(req.user.uid, {
      ...subscriptionPayload,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      purchasedAt: new Date().toISOString(),
    });

    res.json({ success: true, subscription });
  } catch (_error) {
    res.status(500).json({ message: "Failed to verify payment." });
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
