// src/missions/image-generation/hooks/useImageGeneration.ts
import { useCallback, useRef, useState, useMemo } from "react";
import type { ImageGenRequest, ImagePayload } from "./image-generation.types";
import { generateImage } from "./image-generation.api";
import {
  DEFAULT_IMAGE_SIZE,
  IMAGE_SIZES,
  ImageSize,
} from "./image-generation.constants";
import {
  copyImageToClipboard,
  downloadDataUrl,
  validatePrompt,
} from "./image-generation.utils";
import { toastSuccess, toastError } from "@/lovable-mission/ui/Toast";

export type UIState = "idle" | "submitting" | "result" | "error";

export function useImageGeneration(
  initialPrompt = "",
  referenceImageUrl?: string,
  userEmail?: string, // NEW: Add userEmail parameter
) {
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [size, setSize] = useState<ImageSize>(DEFAULT_IMAGE_SIZE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [images, setImages] = useState<ImagePayload[]>([]);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const lastRequestRef = useRef<{
    prompt: string;
    size: ImageSize;
    referenceImageUrl?: string;
    userEmail?: string; // NEW: Store email in last request
  } | null>(null);

  const uiState: UIState = useMemo(() => {
    if (isLoading) return "submitting";
    if (error) return "error";
    if (images.length > 0) return "result";
    return "idle";
  }, [isLoading, error, images.length]);

  const submit = useCallback(
    async (opts?: { n?: number }) => {
      const err = validatePrompt(prompt);

      if (err) {
        setError(err);
        toastError(err);
        return null;
      }

      // NEW: Validate email
      if (!userEmail || !userEmail.trim()) {
        const emailErr = "البريد الإلكتروني مطلوب";
        setError(emailErr);
        toastError(emailErr);
        return null;
      }

      setError(null);
      setIsLoading(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const body: ImageGenRequest = {
        prompt,
        size: "1024x1024",
        n: opts?.n ?? 1,
        referenceImageUrl,
        userEmail, // NEW: Include email in request
      };

      lastRequestRef.current = { prompt, size, referenceImageUrl, userEmail };

      try {
        const resp = await generateImage(body, {
          signal: abortRef.current.signal,
        });

        if (!resp.ok) {
          setError(resp.error);
          toastError(resp.error);
          setImages([]);
          return null;
        }

        setImages(resp.images);
        toastSuccess("تم توليد الصورة بنجاح وحفظها");
        return resp.images;
      } catch (err: any) {
        const msg = "حدث خطأ أثناء طلب التوليد. حاول مرة أخرى.";
        setError(msg);
        toastError(msg);
        setImages([]);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [prompt, size, referenceImageUrl, userEmail], // NEW: Add userEmail to dependencies
  );

  const generateAgain = useCallback(async () => {
    const last = lastRequestRef.current;

    if (!last) {
      return submit();
    }

    setIsLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const body: ImageGenRequest = {
      prompt: last.prompt,
      size: last.size,
      n: 1,
      referenceImageUrl: last.referenceImageUrl,
      userEmail: last.userEmail, // NEW: Include email from last request
    };

    try {
      const resp = await generateImage(body, {
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        setError(resp.error);
        toastError(resp.error);
        setImages([]);
        return null;
      }

      setImages(resp.images);
      toastSuccess("تم توليد الصورة مرة أخرى");
      return resp.images;
    } catch {
      const msg = "حدث خطأ أثناء طلب التوليد. حاول مرة أخرى.";
      setError(msg);
      toastError(msg);
      setImages([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [submit]);

  const newPrompt = useCallback(() => {
    setPrompt("");
    setImages([]);
    setError(null);
    abortRef.current?.abort();
    lastRequestRef.current = null;
  }, []);

  const resetToPrompt = useCallback(() => {
    setError(null);
  }, []);

  const download = useCallback(async (dataUrl: string, filename?: string) => {
    const name = filename ?? `image-${Date.now()}.png`;
    const ok = await downloadDataUrl(dataUrl, name);

    if (ok) toastSuccess("تم تنزيل الصورة");
    else toastError("فشل التنزيل. حاول مرة أخرى.");

    return ok;
  }, []);

  const copy = useCallback(async (dataUrl: string) => {
    const ok = await copyImageToClipboard(dataUrl);

    if (ok) {
      toastSuccess("تم نسخ الصورة إلى الحافظة");
    } else {
      toastError("فشل النسخ، حاول تنزيل الصورة بدلًا من ذلك.");
    }

    return ok;
  }, []);

  return {
    prompt,
    setPrompt,
    size,
    setSize,
    imageSizes: IMAGE_SIZES,
    isLoading,
    images,
    error,
    uiState,
    submit,
    generateAgain,
    newPrompt,
    resetToPrompt,
    download,
    copy,
  } as const;
}
