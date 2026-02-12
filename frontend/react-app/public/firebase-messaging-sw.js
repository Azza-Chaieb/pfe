// public/firebase-messaging-sw.js
// Fichier VIDE pour l'instant - juste pour que Firebase soit content
console.log('Service Worker Firebase chargé');

// Événements de base
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
});

// Ce fichier est requis par Firebase même s'il ne fait rien