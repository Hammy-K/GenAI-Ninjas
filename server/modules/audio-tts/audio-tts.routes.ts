import { Router } from "express";
import { handleTts } from "./audio-tts.handler";

export function registerAudioTtsRoutes(router: Router): void {
  const ttsRouter = Router();

  ttsRouter.post("/", handleTts);

  router.use("/ai/audio/tts", ttsRouter);
}
