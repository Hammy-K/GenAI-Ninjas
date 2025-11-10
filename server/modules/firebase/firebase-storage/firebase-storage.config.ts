export const firebaseStorageConfig = (() => {
  const bucketName = `gs://genaiapp-a7934.firebasestorage.app`;

  const appEnv = (process.env.NODE_ENV || "development").toLowerCase();

  const envFolder = appEnv === "production" ? "production" : "development";

  return {
    bucketName,
    envFolder,
  };
})();
