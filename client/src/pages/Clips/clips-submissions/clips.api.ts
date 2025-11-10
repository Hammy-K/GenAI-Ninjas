import type { ClipListResponse, ClipVoteType } from "./clips.types";

function toQuery(params: Record<string, any>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");

  return q ? `?${q}` : "";
}

export async function listClipsApi(args: {
  page?: number;
  limit?: number;
  search?: string;
  isFeatured?: boolean;
  viewerEmail?: string | null;
}): Promise<ClipListResponse> {
  const { page = 1, limit = 30, search, isFeatured, viewerEmail } = args;

  const offset = (page - 1) * limit;

  const qs = toQuery({ limit, offset, search, isFeatured, viewerEmail });

  const res = await fetch(`/api/media/clips${qs}`, { method: "GET" });

  const json = await res.json();

  if (!res.ok || !json?.ok) throw new Error(json?.error || "fetch_failed");

  return json as ClipListResponse;
}

export async function toggleVoteApi(
  clipId: number,
  body: { trackStudentEmail: string; type: ClipVoteType },
) {
  const res = await fetch(`/api/media/clips/${clipId}/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok || !json?.ok) throw new Error(json?.error || "toggle_failed");

  return json;
}

export async function getClipsByEmailApi(
  email: string,
  limit = 1,
): Promise<ClipListResponse> {
  const qs = `?email=${encodeURIComponent(email)}&limit=${limit}`;

  const res = await fetch(`/api/media/clips/by-email${qs}`, { method: "GET" });

  const json = await res.json();

  if (!res.ok || !json?.ok) throw new Error(json?.error || "fetch_failed");

  return json as ClipListResponse;
}
