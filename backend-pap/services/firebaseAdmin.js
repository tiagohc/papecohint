const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
// Expects env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// Or a service account JSON file path in GOOGLE_APPLICATION_CREDENTIALS
function initFirebase() {
  if (admin.apps.length > 0) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      let parsedKey = privateKey.trim();
      // If the key is wrapped in quotes, remove them
      if ((parsedKey.startsWith('"') && parsedKey.endsWith('"')) ||
          (parsedKey.startsWith("'") && parsedKey.endsWith("'"))) {
        parsedKey = parsedKey.slice(1, -1);
      }
      // Replace literal \n with real newlines
      parsedKey = parsedKey.replace(/\\n/g, "\n");
      // Ensure it starts/ends with proper PEM markers
      if (!parsedKey.startsWith("-----BEGIN")) {
        parsedKey = "-----BEGIN PRIVATE KEY-----\n" + parsedKey;
      }
      if (!parsedKey.endsWith("-----\n") && !parsedKey.endsWith("-----")) {
        parsedKey = parsedKey + "\n-----END PRIVATE KEY-----\n";
      }

      console.log("🔑 Private key starts with:", parsedKey.substring(0, 30));
      console.log("🔑 Private key ends with:", parsedKey.substring(parsedKey.length - 30));
      console.log("🔑 Private key length:", parsedKey.length);
      console.log("🔑 Contains real newlines:", parsedKey.includes("\n"));

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: parsedKey,
        }),
      });
      console.log("✅ Firebase Admin SDK initialized");
      return admin;
    } catch (err) {
      console.error("⚠️  Firebase init failed — push notifications disabled:", err.message);
      return null;
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log("✅ Firebase Admin SDK initialized");
      return admin;
    } catch (err) {
      console.error("⚠️  Firebase init failed:", err.message);
      return null;
    }
  } else {
    console.warn("⚠️  Firebase not configured — push notifications disabled. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env");
    return null;
  }
}

const firebaseAdmin = initFirebase();

module.exports = firebaseAdmin;
