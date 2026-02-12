// src/firebase.js - SIMPLIFIÉ SANS ERREUR
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDDLjB7ZTTEgBnAUcpgeIDRRJrk9nupi_o",
  authDomain: "sunspace-82fc8.firebaseapp.com",
  projectId: "sunspace-82fc8",
  storageBucket: "sunspace-82fc8.firebasestorage.app",
  messagingSenderId: "916888366760",
  appId: "1:916888366760:web:cc18fefb3e104a67b1dc9d"
};

// Initialise SEULEMENT l'app pour l'instant
const app = initializeApp(firebaseConfig);
console.log("✅ Firebase App initialisée");

export { app };