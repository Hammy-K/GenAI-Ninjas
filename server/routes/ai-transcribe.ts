import openai from "@shared/openai";
import { Router, Request, Response } from "express";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (OpenAI's limit)
  },
});

export function registerTranscribeRoute(router: Router) {
  const transcribeRoutes = Router();

  transcribeRoutes.post(
    "/",
    upload.single("audio"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No audio file provided" });
        }

        const audioFile = new File(
          [req.file.buffer],
          req.file.originalname || "audio.webm",
          {
            type: req.file.mimetype,
          },
        );

        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "gpt-4o-transcribe", // gpt-4o-mini-transcribe
          language: "ar",
          response_format: "text",
        });

        res.status(200).json({ text: transcription });
      } catch (error) {
        console.error("Error transcribing audio:", error);

        res.status(500).json({ error: "Transcription failed" });
      }
    },
  );

  router.use("/ai-transcribe", transcribeRoutes);
}
