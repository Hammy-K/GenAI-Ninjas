import type {
  ImageGenRequest,
  ImageGenResponse,
  ImageGenError,
} from "./image-generation.types";

import { API_PATH } from "./image-generation.constants";

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateImage(
  body: ImageGenRequest,
  opts?: { signal?: AbortSignal },
): Promise<ImageGenResponse> {
  try {
    const res = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts?.signal,
    });

    const data = await safeJson(res);

    if (data && typeof data === "object" && "ok" in data) {
      return data as ImageGenResponse;
    }

    return {
      ok: false,
      error: "حدث خطأ غير متوقع من الخادم.",
    } as ImageGenError;
  } catch (err: any) {
    return {
      ok: false,
      error: "فشل الاتصال بالخادم. يرجى المحاولة لاحقًا.",
    } as ImageGenError;
  }
}
