import admin from "firebase-admin";

// Use environment variables for Firebase configuration
// You should place your service account JSON content in FIREBASE_SERVICE_ACCOUNT or provide the path in FIREBASE_CREDENTIALS_PATH
const initializeFirebase = () => {
  try {
    if (admin.apps.length === 0) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("[NotificationService] Firebase Admin initialized.");
      } else {
        console.warn(
          "[NotificationService] Firebase Service Account not found in environment. Push notifications will be disabled.",
        );
      }
    }
  } catch (error) {
    console.error(
      "[NotificationService] Firebase initialization error:",
      error.message,
    );
  }
};

export default {
  /**
   * Send push notification to a list of tokens
   */
  async sendPushNotification(
    tokens: string | string[],
    title: string,
    body: string,
    data?: any,
  ) {
    initializeFirebase();

    if (admin.apps.length === 0) {
      console.warn(
        "[NotificationService] Skipping push notification: Firebase not initialized.",
      );
      return;
    }

    const tokenList = Array.isArray(tokens) ? tokens : [tokens];
    const validTokens = tokenList.filter((t) => t && t.length > 0);

    if (validTokens.length === 0) return;

    const message = {
      notification: { title, body },
      data: data || {},
      tokens: validTokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(
        `[NotificationService] Push notification sent: ${response.successCount} success, ${response.failureCount} failure.`,
      );
      return response;
    } catch (error) {
      console.error(
        "[NotificationService] Error sending push notification:",
        error.message,
      );
      throw error;
    }
  },

  /**
   * Notify user about a reservation update
   */
  async notifyReservationUpdate(
    user: any,
    title: string,
    body: string,
    reservationDetails?: any,
  ) {
    const fcmToken = user.fcmToken;
    if (!fcmToken) {
      console.log(
        `[NotificationService] No FCM Token for user ${user.id}, skipping push notification.`,
      );
      return;
    }

    try {
      await this.sendPushNotification(fcmToken, title, body, {
        reservationId: reservationDetails?.reservationId || "",
        type: "reservation_update",
      });
    } catch (error) {
      console.error(
        "[NotificationService] Failed to notify user:",
        error.message,
      );
    }
  },
};
