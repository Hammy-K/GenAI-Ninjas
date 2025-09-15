import type { Request, Response } from "express";
import { openai } from "server/config/ai-config/openai/openai.config";
import { isContentSafe } from "server/services/ai-moderation";
import type {
  ImageGenRequest,
  ImageGenResponse,
  ImageGenError,
  ImageGenSuccess,
} from "./image-generation.types";
import { validatePrompt, b64ToDataUrl } from "./image-generation.utils";

export async function handleImageGeneration(req: Request, res: Response) {
  const body = req.body as Partial<ImageGenRequest> | undefined;

  const promptError = validatePrompt(body?.prompt);
 
  if (promptError) {
    const payload: ImageGenError = { ok: false, error: promptError };
  
    return res.status(400).json(payload);
  }

  const prompt = (body!.prompt as string).trim();
  const size = body?.size ?? "1024x1024";
  const n = Math.max(1, Math.min(4, body?.n ?? 1));

  try {
    const safe = await isContentSafe(prompt);
    
    if (!safe) {
      const payload: ImageGenError = {
        ok: false,
        error: "المحتوى المرسل مرفوض.",
      };
      
      return res.status(400).json(payload);
    }
  } catch (err) {
    console.warn(
      "[image-gen] moderation failed, continuing:",
      (err as any)?.message ?? err,
    );
  }

  try {
    const result = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
      prompt,
      n,
      size,
    } as any);

    if (
      !result?.data ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      const payload: ImageGenError = {
        ok: false,
        error: "No image returned from provider.",
      };
      return res.status(502).json(payload);
    }

    const images = result.data
      .slice(0, n)
      .map((item: any) => {
        const b64 = item.b64_json ?? item.b64 ?? null;
        if (!b64 || typeof b64 !== "string") return null;
        return b64ToDataUrl(b64, "image/png");
      })
      .filter(Boolean) as any[];

    if (!images.length) {
      const payload: ImageGenError = {
        ok: false,
        error: "Image payload malformed.",
      };
      return res.status(502).json(payload);
    }

    const payload: ImageGenSuccess = { ok: true, images };
    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("[image-gen] OpenAI Images API error:", err?.message ?? err);
    const payload: ImageGenError = {
      ok: false,
      error: "فشل توليد الصورة. حاول مرة أخرى لاحقًا.",
    };
    return res.status(500).json(payload);
  }
}
