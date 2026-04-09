/* eslint-disable no-restricted-globals */
// Fallback service worker for development (next-pwa is disabled in dev).
// In production, the custom worker code in /worker/index.js is merged into sw.js by next-pwa.
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase config — must match your project values
firebase.initializeApp({
  apiKey: "AIzaSyDttTrE_38kj--tQXW3ZsQPtWnpgnxvbso",
  authDomain: "ecohint-d0c48.firebaseapp.com",
  projectId: "ecohint-d0c48",
  storageBucket: "ecohint-d0c48.firebasestorage.app",
  messagingSenderId: "15782790336",
  appId: "1:15782790336:web:d9aa3ecb70f27753a1d925",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "EcoHint";
  const options = {
    body: payload.notification?.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: payload.data,
    tag: "ecohint-notification",
  };

  self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow("/user/notificacoes");
    })
  );
});
