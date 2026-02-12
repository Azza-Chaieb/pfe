// src/services/simpleFirebaseTest.js
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";

const vapidKey = "BGTD7P57pwrdf9GAqAo1r0-hi74CYPBgw-odCAgUs5cmdeKO53wH9GoRL9mBIc7P5VxgdX7F4CqHTuBcqyOmz0s";

// Fonction SIMPLE pour tester Firebase
export async function simpleFirebaseTest() {
  try {
    console.log("1. Demande de permission...");
    
    // Demander la permission
    const permission = await Notification.requestPermission();
    console.log("Permission:", permission);
    
    if (permission !== "granted") {
      alert("❌ Permission refusée. Active les notifications dans les paramètres du navigateur.");
      return null;
    }
    
    console.log("2. Récupération du token FCM...");
    
    // Récupérer le token
    const token = await getToken(messaging, { vapidKey });
    console.log("Token obtenu:", token);
    
    // Afficher le token
    alert(`✅ SUCCÈS !\n\nToken FCM :\n${token}\n\nCopie ce token pour tester dans Firebase Console.`);
    
    // Configurer l'écoute des messages
    setupMessageListener();
    
    return token;
    
  } catch (error) {
    console.error("ERREUR COMPLÈTE:", error);
    alert(`❌ ERREUR : ${error.message}\n\nVérifie ta clé VAPID et la config Firebase.`);
    return null;
  }
}

// Écouter les messages
function setupMessageListener() {
  onMessage(messaging, (payload) => {
    console.log("📨 NOTIFICATION REÇUE:", payload);
    
    // Créer une notification UI
    createNotificationUI(payload);
  });
}

// Créer une notification dans l'interface
function createNotificationUI(payload) {
  const notification = document.createElement('div');
  notification.id = 'firebase-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    z-index: 99999;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    max-width: 350px;
    animation: slideInRight 0.5s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-left: 5px solid #4CAF50;
  `;
  
  const title = payload.notification?.title || 'Nouvelle notification';
  const body = payload.notification?.body || 'Tu as un nouveau message';
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 10px;">
      <div style="background: white; color: #667eea; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold;">
        🔔
      </div>
      <strong style="font-size: 16px;">${title}</strong>
    </div>
    <div style="font-size: 14px; opacity: 0.9; line-height: 1.4;">${body}</div>
    <div style="margin-top: 10px; font-size: 12px; opacity: 0.7; text-align: right;">
      ${new Date().toLocaleTimeString()}
    </div>
    <button onclick="this.parentElement.remove()" style="position: absolute; top: 10px; right: 10px; background: transparent; border: none; color: white; font-size: 16px; cursor: pointer;">×</button>
  `;
  
  document.body.appendChild(notification);
  
  // Supprimer après 8 secondes
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.animation = 'slideOutRight 0.5s ease';
      setTimeout(() => notification.remove(), 500);
    }
  }, 8000);
}

// Ajouter les animations CSS
if (!document.querySelector('#firebase-notification-styles')) {
  const style = document.createElement('style');
  style.id = 'firebase-notification-styles';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Vérifications
export function checkFirebaseSupport() {
  const checks = {
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    messaging: typeof messaging !== 'undefined',
    vapidKey: vapidKey && vapidKey.length > 50
  };
  
  console.log("Vérifications Firebase:", checks);
  return checks;
}