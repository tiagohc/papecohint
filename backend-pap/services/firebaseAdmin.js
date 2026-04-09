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
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    console.warn("⚠️  Firebase not configured — push notifications disabled. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env");
    return null;
  }

  console.log("✅ Firebase Admin SDK initialized");
  return admin;
}

const firebaseAdmin = initFirebase();

module.exports = firebaseAdmin;
