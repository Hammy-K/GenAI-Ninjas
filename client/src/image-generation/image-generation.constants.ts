export const IMAGE_SIZES = [
  "1024x1024",
  "1024x1536",
  "1536x1024",
  "auto",
] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];

export const DEFAULT_IMAGE_SIZE: ImageSize = "1024x1024";

export const PROMPT_MIN_LINES = 2;
export const PROMPT_MAX_LINES = 10;
export const PROMPT_MIN_CHARS = 1;
export const REFERENCE_IMAGE_URL =
  "https://replit.com/@hamzakhlifawi/GenAI-Ninjas#public/assets/sad_pengy.png";

export const API_PATH = "/api/image-generation";
