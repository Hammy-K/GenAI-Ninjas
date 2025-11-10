import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { firebaseConfig } from "./firebase.config";
import { firebaseStorageConfig } from "./firebase-storage/firebase-storage.config";

export function getFirebaseAdminApp(): App {
  let app: App;

  if (getApps().length) {
    app = getApp();
  } else {
    app = initializeApp({
      credential: cert(firebaseConfig.serviceAccount as any),
      storageBucket: firebaseStorageConfig.bucketName,
    });
  }

  return app;
}

export function getFirebaseStorageBucket() {
  const app = getFirebaseAdminApp();

  return getStorage(app).bucket(firebaseStorageConfig.bucketName);
}
