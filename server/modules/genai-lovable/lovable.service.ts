import {
  openai,
  OPENAI_TEMPERATURE,
} from "server/config/ai-config/openai/openai.config";
import { LOVABLE_OPENAI_SYSTEM_PROMPT } from "./lovable.system.prompt";
import {
  LovableAiResponse,
  LovableAiResponseZ,
  OPENAI_JSON_SCHEMA,
} from "./lovable.response.schema";
import { LovableChatRequest } from "./lovable.request.schema";

const MODEL = "gpt-4.1-mini";

export async function generateLovableAiResponse(
  req: LovableChatRequest,
): Promise<LovableAiResponse> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: OPENAI_TEMPERATURE,
    response_format: { type: "json_schema", json_schema: OPENAI_JSON_SCHEMA },
    messages: [
      { role: "system", content: LOVABLE_OPENAI_SYSTEM_PROMPT },
      ...(req.history ?? []),
    ],
  });

  const raw = completion.choices?.[0]?.message?.content ?? "{}";

  const parsed = JSON.parse(raw);

  // Validate & coerce
  const validated = LovableAiResponseZ.parse(parsed);

  // Guardrail: ensure welcomeDone is true even if model forgets.
  if (!validated.progress.welcomeDone) {
    validated.progress.welcomeDone = true;
  }

  return validated;
}
