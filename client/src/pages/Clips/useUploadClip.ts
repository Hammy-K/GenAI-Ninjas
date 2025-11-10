import { useMutation } from "@tanstack/react-query";

export type UploadClipPayload = {
  title: string;
  trackStudentEmail: string;
  file: File;
  isFeatured?: boolean;
};

export type UploadClipResponse =
  | { ok: true; data: any }
  | { ok: false; error: string };

async function uploadClipRequest(
  payload: UploadClipPayload,
): Promise<UploadClipResponse> {
  const form = new FormData();

  form.append("title", payload.title);

  form.append("trackStudentEmail", payload.trackStudentEmail);

  form.append("file", payload.file);

  if (typeof payload.isFeatured === "boolean") {
    form.append("isFeatured", String(payload.isFeatured));
  }

  const res = await fetch("/api/media/clips/upload", {
    method: "POST",
    body: form,
  });

  const json = await res.json().catch(() => ({}));

  return json as UploadClipResponse;
}

export function useUploadClip() {
  return useMutation({
    mutationKey: ["upload-clip"],
    mutationFn: uploadClipRequest,
  });
}
