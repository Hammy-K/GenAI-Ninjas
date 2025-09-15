import type {
  ChatMessage,
  LovableAiResponse,
  LovableChatRequest,
} from "../types/lovable.types";

const BASE = "/api/genai/lovable";

const DEFAULT_STATE: LovableAiResponse = {
  aiMessage: "حدث خطأ بسيط. حاول مرة أخرى.",
  isReadyToGoToLovable: false,
  progress: {
    welcomeDone: true,
    ideationOngoing: false,
    readyDone: false,
    buildingOngoing: false,
  },
};

export async function sendChat(params: {
  history: ChatMessage[];
  message: string;
  lastResponse?: LovableAiResponse;
  signal?: AbortSignal;
}): Promise<LovableAiResponse> {
  const body: LovableChatRequest = {
    history: params.history ?? [],
    message: params.message ?? "",
    lastResponse: params.lastResponse,
  };

  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: params.signal,
  });

  if (res.status === 400) {
    const err = await safeJson(res);

    throw new Error(err?.error ?? "Message is required");
  }

  // Server will return lastResponse (or a default) on moderation/500 as 200 OK
  // so we always try to parse JSON and fallback if needed.
  if (!res.ok) {
    // Non-200 unexpected; return last known state or default
    return params.lastResponse ?? DEFAULT_STATE;
  }

  const data = (await safeJson(res)) as unknown;

  // Minimal runtime guard: ensure shape has aiMessage + progress
  if (
    data &&
    typeof (data as any).aiMessage === "string" &&
    (data as any).progress &&
    typeof (data as any).progress === "object"
  ) {
    return data as LovableAiResponse;
  }

  // If server responded oddly, fallback gracefully
  return params.lastResponse ?? DEFAULT_STATE;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSubmissions(params?: {
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "updatedAt";
  orderDirection?: "asc" | "desc";
  featured?: boolean;
  signal?: AbortSignal;
}) {
  const qs = new URLSearchParams();

  if (params?.search) qs.set("search", params.search);

  if (params?.limit !== undefined && params?.limit !== null)
    qs.set("limit", String(params.limit));

  if (params?.offset !== undefined && params?.offset !== null)
    qs.set("offset", String(params.offset));

  if (params?.orderBy) qs.set("orderBy", params.orderBy);
  if (params?.orderDirection) qs.set("orderDirection", params.orderDirection);

  if (params?.featured !== undefined)
    qs.set("isFeatured", String(params.featured));

  const res = await fetch(`/api/genai/lovable/submissions?${qs.toString()}`, {
    method: "GET",
    signal: params?.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? "تعذر تحميل المشاريع");
  }

  return res.json();
}
