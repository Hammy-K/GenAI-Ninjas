import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseFormat } from "../types/video-generator-chat.types";

export const VideoGeneratorChatResponseZ = z.object({
  aiMessage: z.string(),
});

export type VideoGeneratorChatResponse = z.infer<
  typeof VideoGeneratorChatResponseZ
>;

const OPENAI_JSON_SCHEMA = zodTextFormat(
  VideoGeneratorChatResponseZ,
  "video_generator_chat_response",
);

export const VIDEO_GENERATOR_CHAT_RESPONSE_FORMAT: ResponseFormat = {
  name: OPENAI_JSON_SCHEMA.name,
  schema: OPENAI_JSON_SCHEMA.schema,
  strict: true,
};
