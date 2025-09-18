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
    let arMsg = "مدخلات البرومبت غير صالحة.";

    if (promptError === "Prompt must be a string.")
      arMsg = "نص البرومبت غير صالح.";

    if (promptError === "Prompt is required.") arMsg = "البرومبت مطلوب.";

    if (promptError === "Prompt is too short.") arMsg = "البرومبت قصير جدًا.";

    const payload: ImageGenError = { ok: false, error: arMsg };

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
  } catch (err: any) {
    console.error(
      "[image-gen] فشل التحقق من سلامة المحتوى:",
      err?.message ?? err,
    );

    const payload: ImageGenError = {
      ok: false,
      error: "حدث خطأ أثناء التحقق من المحتوى. حاول مرة أخرى لاحقًا.",
    };

    return res.status(500).json(payload);
  }

  try {
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n,
      size,
      quality: "medium",
    });

    if (
      !result?.data ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      const payload: ImageGenError = {
        ok: false,
        error: "لم يتم استلام صورة من المزود.",
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
        error: "تنسيق الصورة المستلمة غير صالح.",
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
