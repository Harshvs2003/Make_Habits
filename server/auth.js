const admin = require("firebase-admin");

const projectId = (process.env.FIREBASE_PROJECT_ID || "").trim();
const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

const hasServiceAccount = projectId && clientEmail && privateKey;

if (!admin.apps.length && hasServiceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const ensureFirebaseConfigured = () => {
  if (!hasServiceAccount) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }
};

const requireAuth = async (req, res, next) => {
  try {
    ensureFirebaseConfigured();

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    if (!token) {
      res.status(401).json({ message: "Missing auth token." });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
      picture: decoded.picture || "",
    };

    next();
  } catch (_error) {
    res.status(401).json({ message: "Unauthorized." });
  }
};

module.exports = {
  requireAuth,
  ensureFirebaseConfigured,
};
