export type ImageGenRequest = {
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
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
