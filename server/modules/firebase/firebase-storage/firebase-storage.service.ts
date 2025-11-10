import { getFirebaseStorageBucket } from "./firebase-storage.client";
import { buildPublicUrl } from "./firebase-storage.utils";

export async function uploadBufferToPath(input: {
  buffer: Buffer;
  destPath: string;
  contentType?: string;
  cacheControl?: string;
}): Promise<{ publicUrl: string; gcsPath: string }> {
  const bucket = getFirebaseStorageBucket();

  const file = bucket.file(input.destPath);

  const contentType = input.contentType ?? "application/octet-stream";

  const cacheControl =
    input.cacheControl ?? "public, max-age=31536000, immutable";

  await file.save(input.buffer, {
    contentType,
    resumable: false,
    public: true,
    metadata: { contentType, cacheControl },
    validation: false,
  });

  try {
    await file.makePublic();
  } catch {
    /* already public */
  }

  return {
    publicUrl: buildPublicUrl(bucket.name, input.destPath),
    gcsPath: input.destPath,
  };
}

export async function deleteAtPath(destPath: string): Promise<void> {
  const bucket = getFirebaseStorageBucket();

  await bucket.file(destPath).delete({ ignoreNotFound: true });
}

export async function existsAtPath(destPath: string): Promise<boolean> {
  const bucket = getFirebaseStorageBucket();

  const [exists] = await bucket.file(destPath).exists();

  return !!exists;
}
