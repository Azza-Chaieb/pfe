// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBLEZXX-86u6I9h1KAGDgRJq5GyUbfRRfI",
  authDomain: "sunspace-430ae.firebaseapp.com",
  projectId: "sunspace-430ae",
  storageBucket: "sunspace-430ae.appspot.com",
  messagingSenderId: "647611390056",
  appId: "1:647611390056:web:f7dcec652d8bc7836643dd",
  measurementId: "G-PS1C7895BR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional (analytics)
export const analytics = getAnalytics(app);

// For notifications
export const messaging = getMessaging(app);

export default app;

