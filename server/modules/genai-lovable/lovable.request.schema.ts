import { LovableAiResponse } from "./lovable.response.schema";

/** Shape of a chat message exchanged with the AI */
export type LovableChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Progress flags used in responses */
export type LovableProgressFlags = {
  welcomeDone: boolean;
  ideationOngoing: boolean;
  readyDone: boolean;
  buildingOngoing: boolean;
};

/** What the client sends to the endpoint */
export interface LovableChatRequest {
  /** Full conversation so far (assistant+user). Defaults to [] */
  history?: LovableChatMessage[];

  message?: string;

  /**
   * The last Lovable response that the client successfully received & rendered.
   * We will return this on moderation failure or server error to preserve state.
   */
  lastResponse?: LovableAiResponse;
}

/** Normalize request to ensure safe defaults */
export function normalizeLovableChatRequest(
  body: LovableChatRequest,
): LovableChatRequest {
  return {
    history: body.history ?? [],
    message: body.message ?? "",
    lastResponse: body.lastResponse, // may be undefined — that's fine
  };
}
