export type ImageGenRequest = {
  prompt: string;
  size?: "256x256" | "512x512" | "1024x1024";
  n?: number;
};

export type ImagePayload = {
  b64: string;
  dataUrl: string;
  mimeType: string;
};

export type ImageGenSuccess = {
  ok: true;
  images: ImagePayload[];
};

export type ImageGenError = {
  ok: false;
  error: string;
};

export type ImageGenResponse = ImageGenSuccess | ImageGenError;
