import { getFirebaseMessaging, getToken, onMessage } from "./firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Request notification permission and register token with backend
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (!("serviceWorker" in navigator)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = await getFirebaseMessaging();
  if (!messaging || !VAPID_KEY) return null;

  try {
    // In production, next-pwa registers sw.js which includes our custom worker code.
    // In development, PWA is disabled so we register firebase-messaging-sw.js as fallback.
    let registration: ServiceWorkerRegistration;
    const existingReg = await navigator.serviceWorker.getRegistration("/");

    if (existingReg) {
      registration = existingReg;
    } else {
      // Dev fallback: register the Firebase-only service worker
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await registerTokenOnBackend(token);
      return token;
    }
  } catch (err) {
    console.error("Error getting FCM token:", err);
  }

  return null;
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  getFirebaseMessaging().then((messaging) => {
    if (!messaging) return;
    onMessage(messaging, callback);
  });
}

/**
 * Register FCM token in backend
 */
async function registerTokenOnBackend(token: string) {
  const authToken = localStorage.getItem("token");
  if (!authToken) return;

  const lang = localStorage.getItem("language") || "pt";

  try {
    await fetch("/api/user/notifications/register-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token, lang }),
    });
  } catch (err) {
    console.error("Error registering FCM token:", err);
  }
}

/**
 * Unregister FCM token from backend
 */
export async function unregisterPush(token: string) {
  const authToken = localStorage.getItem("token");
  if (!authToken) return;

  try {
    await fetch("/api/user/notifications/unregister-token", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    console.error("Error unregistering FCM token:", err);
  }
}
