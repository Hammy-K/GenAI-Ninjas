import { uploadBufferToPath } from "server/modules/firebase/firebase-storage/firebase-storage.service";
import { getIsProd } from "../media.utils";

type UploadClipOptions = {
  contentType?: string;
};

export const clipsStorageUtil = {
  buildDestPath(): string {
    const envFolder = getIsProd() ? "production" : "development";

    const ts = Date.now();

    return `clips/${envFolder}/${ts}.mp4`;
  },

  async uploadClip(buffer: Buffer, opts?: UploadClipOptions): Promise<string> {
    const destPath = this.buildDestPath();

    const { publicUrl: clipUrl } = await uploadBufferToPath({
      buffer,
      destPath,
      contentType: opts?.contentType ?? "video/mp4",
    });

    return clipUrl;
  },
};
