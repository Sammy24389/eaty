import admin from "firebase-admin";

let initialized = false;

export async function getFirebaseApp() {
  if (!initialized) {
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        initialized = true;
      }
    } catch {
      console.warn("Firebase Admin SDK not initialized");
    }
  }

  return admin;
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const app = await getFirebaseApp();
  if (!app.apps.length) {
    return { success: 0, failure: tokens.length };
  }

  const message: admin.messaging.MulticastMessage = {
    notification: { title, body },
    data,
    tokens,
  };

  try {
    const response = await app.messaging().sendEachForMulticast(message);
    return {
      success: response.successCount,
      failure: response.failureCount,
    };
  } catch {
    return { success: 0, failure: tokens.length };
  }
}

export async function sendToDevice(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  return sendPushNotification([token], title, body, data);
}
