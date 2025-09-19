import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Core video flow types
export const AspectRatioZ = z.enum(["9:16", "16:9"]);

export const SceneZ = z.object({
  description: z.string().min(10, "Scene description must be at least 10 characters"),
  voiceover: z.string().min(5, "Voiceover script must be at least 5 characters"),
  aspectRatio: AspectRatioZ,
});

export const FacilitatorZ = z.object({
  facilitator_name: z.string(),
  student_email: z.string().email(),
});

// Auth requests/responses
export const GoogleAuthRequestZ = z.object({
  idToken: z.string(),
});

export const AuthResponseZ = z.object({
  success: z.boolean(),
  user: z.object({
    uid: z.string(),
    email: z.string(),
  }).optional(),
  error: z.string().optional(),
});

// Facilitator requests/responses
export const FacilitatorConfirmRequestZ = z.object({
  facilitatorName: z.string(),
});

export const FacilitatorsResponseZ = z.object({
  facilitators: z.array(z.object({ name: z.string() })),
  matchedFacilitatorName: z.string().optional(),
  confirmedFacilitatorName: z.string().optional(),
  userEmail: z.string().optional(),
});

// Video generation requests/responses
export const GenerateVideoRequestZ = z.object({
  scene: SceneZ,
});

export const VideoStatusZ = z.enum(["processing", "completed", "failed"]);

export const GenerateVideoResponseZ = z.object({
  jobId: z.string(),
  status: VideoStatusZ,
  videoUrl: z.string().optional(),
  error: z.string().optional(),
});

// Usage tracking
export const UsageResponseZ = z.object({
  used: z.number(),
  limit: z.number(),
});

// TypeScript types
export type AspectRatio = z.infer<typeof AspectRatioZ>;
export type Scene = z.infer<typeof SceneZ>;
export type Facilitator = z.infer<typeof FacilitatorZ>;
export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestZ>;
export type AuthResponse = z.infer<typeof AuthResponseZ>;
export type FacilitatorConfirmRequest = z.infer<typeof FacilitatorConfirmRequestZ>;
export type FacilitatorsResponse = z.infer<typeof FacilitatorsResponseZ>;
export type GenerateVideoRequest = z.infer<typeof GenerateVideoRequestZ>;
export type GenerateVideoResponse = z.infer<typeof GenerateVideoResponseZ>;
export type VideoStatus = z.infer<typeof VideoStatusZ>;
export type UsageResponse = z.infer<typeof UsageResponseZ>;