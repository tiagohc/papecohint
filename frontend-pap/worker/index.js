// Custom worker code injected into the PWA service worker by next-pwa
// This adds Firebase Cloud Messaging push notification support

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase config — must match your project values
// These are safe to expose (client-side keys, not secrets)
firebase.initializeApp({
  apiKey: "AIzaSyDttTrE_38kj--tQXW3ZsQPtWnpgnxvbso",
  authDomain: "ecohint-d0c48.firebaseapp.com",
  projectId: "ecohint-d0c48",
  storageBucket: "ecohint-d0c48.firebasestorage.app",
  messagingSenderId: "15782790336",
  appId: "1:15782790336:web:d9aa3ecb70f27753a1d925",
});

const messaging = firebase.messaging();

// Handle background push messages (when app is closed or in background)
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

// Handle notification click — open the app
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
