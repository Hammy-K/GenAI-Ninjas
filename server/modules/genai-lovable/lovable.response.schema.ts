import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

/** Zod schema the model must return */
export const LovableAiResponseZ = z.object({
  aiMessage: z.string(),
  lovablePromptLink: z.string().optional(),
  isReadyToGoToLovable: z.boolean(),
  progress: z.object({
    welcomeDone: z.boolean(), // must be true from the start
    ideationOngoing: z.boolean(), // true while asking guided Qs
    readyDone: z.boolean(), // true when final prompt is produced
    buildingOngoing: z.boolean(), // true only after student says they opened Lovable
  }),
});

export type LovableAiResponse = z.infer<typeof LovableAiResponseZ>;

/** OpenAI-compatible JSON schema (response_format.json_schema) */
const jsonSchema = zodTextFormat(LovableAiResponseZ, "lovable_ai_response");

export const OPENAI_JSON_SCHEMA = {
  name: "lovable_ai_response",
  strict: true,
  schema: jsonSchema.schema ?? jsonSchema,
} as const;

/** Safe default response when no lastResponse is available */
export const DEFAULT_LOVABLE_STATE: LovableAiResponse = {
  aiMessage: "عذرًا، حدث خطأ بسيط. جرّب مرة أخرى بعد لحظات.",
  isReadyToGoToLovable: false,
  progress: {
    welcomeDone: true,
    ideationOngoing: false,
    readyDone: false,
    buildingOngoing: false,
  },
};
