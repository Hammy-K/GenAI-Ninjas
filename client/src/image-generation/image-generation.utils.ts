import { PROMPT_MIN_CHARS } from "./image-generation.constants";

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const meta = parts[0] || "";
  const b64 = parts[1] || "";
  const match = /data:(.+);base64/.exec(meta);
  const mime = match ? match[1] : "image/png";
  const bytes = atob(b64);
  const len = bytes.length;
  const buf = new Uint8Array(len);

  for (let i = 0; i < len; i++) buf[i] = bytes.charCodeAt(i);

  return new Blob([buf], { type: mime });
}

export async function downloadDataUrl(dataUrl: string, filename: string) {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    return true;
  } catch {
    return false;
  }
}

export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    // @ts-ignore ClipboardItem might not be defined in some environments
    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);

    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(dataUrl);
      return true;
    } catch {
      return false;
    }
  }
}

export function validatePrompt(text: string): string | null {
  if (typeof text !== "string") return "البرومبت غير صالح.";

  const trimmed = text.trim();

  if (!trimmed) return "البرومبت مطلوب.";

  if (trimmed.length < PROMPT_MIN_CHARS)
    return `البرومبت قصير جدًا، يرجى كتابة حرف واحد على الأقل.`;

  return null;
}
