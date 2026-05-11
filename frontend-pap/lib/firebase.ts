import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton: garante que a app Firebase só é inicializada uma vez mesmo com re-renders do Next.js.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messagingInstance: Messaging | null = null;

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null; // Firebase Messaging não funciona em SSR
  if (messagingInstance) return messagingInstance; // reutiliza instância já criada

  // Alguns browsers (Safari antigo, modo incógnito) não suportam push notifications
  const supported = await isSupported();
  if (!supported) {
    console.warn("Firebase Messaging not supported in this browser");
    return null;
  }

  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export { getToken, onMessage };
export default app;
