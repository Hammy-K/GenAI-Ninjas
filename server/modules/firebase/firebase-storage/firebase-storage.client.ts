import { getStorage } from "firebase-admin/storage";
import { firebaseStorageConfig } from "./firebase-storage.config";
import { getFirebaseAdminApp } from "../firebase-admin.client";

export function getFirebaseStorageBucket() {
  const app = getFirebaseAdminApp();

  return getStorage(app).bucket(firebaseStorageConfig.bucketName);
}
