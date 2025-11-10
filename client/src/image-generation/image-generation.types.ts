// src/missions/image-generation/types/image-generation.types.ts

export type ImageGenRequest = {
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  n?: number;
  referenceImageUrl?: string;
  userEmail?: string; // NEW: Add email to request type
};

export type ImagePayload = {
  b64: string;
  dataUrl: string;
  mimeType: string;
};

export type ImageGenSuccess = {
  ok: true;
  images: ImagePayload[];
  imageId?: string; // NEW: Return saved image ID
  usage?: any; // NEW: Return usage stats including cache info
};

export type ImageGenError = {
  ok: false;
  error: string;
};

export type ImageGenResponse = ImageGenSuccess | ImageGenError;

export type UIState = "idle" | "submitting" | "result" | "error";
