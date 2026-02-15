import { getMessaging, getToken, onMessage } from "firebase/messaging";
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
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn("Firebase Messaging is not supported in this browser:", error.message);
}

// توليد FCM Token
export const getFcmToken = async () => {
  if (!messaging) {
    console.warn("Firebase Messaging not available.");
    return null;
  }

  const VAPID_KEY = "VAPID_KEY"; // REPLACE WITH YOUR REAL VAPID KEY FROM FIREBASE CONSOLE

  if (VAPID_KEY === "VAPID_KEY") {
    console.warn("Firebase: VAPID_KEY is missing. Push notifications will not work.");
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
    console.error("Error retrieving FCM token:", err);
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
    console.warn("Firebase Messaging not supported, skipping notification permission.");
    return null;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      return await getFcmToken();
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};

