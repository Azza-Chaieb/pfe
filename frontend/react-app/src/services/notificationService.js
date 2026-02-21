import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBLEZXX-86u6I9h1KAGDgRJq5GyUbfRRfI",
  authDomain: "sunspace-430ae.firebaseapp.com",
  projectId: "sunspace-430ae",
  messagingSenderId: "647611390056",
  appId: "1:647611390056:web:f7dcec652d8bc7836643dd",
};

const app = initializeApp(firebaseConfig);

let messaging = null;

// Use an async approach or just catch the unsupported error during init
const initMessaging = async () => {
  try {
    if (await isSupported()) {
      messaging = getMessaging(app);
      return messaging;
    }
    console.warn(
      "Firebase Messaging is not supported in this environment (requires HTTPS or localhost).",
    );
  } catch (error) {
    console.warn("Firebase Messaging initialization error:", error.message);
  }
  return null;
};

// Initialize early
initMessaging();

// توليد FCM Token
export const getFcmToken = async () => {
  if (!messaging) {
    console.warn("Firebase Messaging not available.");
    return null;
  }

  const VAPID_KEY = import.meta.env.VITE_VAPID_KEY;

  if (VAPID_KEY === "VAPID_KEY") {
    console.warn(
      "Firebase: VAPID_KEY is missing. Push notifications will not work.",
    );
    return null;
  }

  try {
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (currentToken) {
      console.log("FCM Token:", currentToken);
      return currentToken;
    } else {
      console.log("No registration token available.");
      return null;
    }
  } catch (err) {
    if (
      err.message?.includes("401") ||
      err.message?.includes("authentication")
    ) {
      console.warn(
        "Firebase Messaging 401: Veuillez vérifier votre clé VAPID et la configuration de l'API Cloud Messaging dans la console Firebase.",
      );
    } else {
      console.error("Error retrieving FCM token:", err);
    }
    return null;
  }
};

// استقبال notifications مباشرة في الـ frontend
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      resolve(payload);
    });
  });

export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.warn(
      "Firebase Messaging not supported, skipping notification permission.",
    );
    return null;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
      return await getFcmToken();
    } else {
      console.log("Unable to get permission to notify.");
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
  }
};
