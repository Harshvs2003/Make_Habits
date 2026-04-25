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

const parseBearerToken = (authorizationHeader = "") => {
  const [scheme, token] = authorizationHeader.trim().split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return "";
  }
  return token.trim();
};

const getAuthErrorMessage = (error) => {
  const code = error?.code || "";

  if (code === "auth/id-token-expired") {
    return "Auth token expired. Please sign in again.";
  }

  if (
    code === "auth/argument-error" ||
    code === "auth/invalid-id-token" ||
    code === "auth/id-token-revoked"
  ) {
    return "Invalid auth token.";
  }

  if (code === "auth/user-disabled") {
    return "This Firebase user account is disabled.";
  }

  return "Unauthorized.";
};

const requireAuth = async (req, res, next) => {
  try {
    ensureFirebaseConfigured();

    const authHeader = req.headers.authorization || "";
    const token = parseBearerToken(authHeader);

    if (!token) {
      res.status(401).json({ message: "Missing auth token." });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(token, true);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
      picture: decoded.picture || "",
    };

    next();
  } catch (error) {
    res.status(401).json({ message: getAuthErrorMessage(error) });
  }
};

module.exports = {
  requireAuth,
  ensureFirebaseConfigured,
};
