import { Router } from "express";
import { db } from "../db";
import {
  videoLibrarySessions,
  videoLibraryVideos,
  videoLibrary,
} from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Static admin password
const ADMIN_PASSWORD = "videolib2025";

// Generate random 6-character code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Create a new video library session
router.post("/api/video-library", async (req, res) => {
  try {
    const { password, title, videos } = req.body;

    // Check password
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Validate input
    if (!title || !videos || !Array.isArray(videos) || videos.length === 0) {
      return res
        .status(400)
        .json({ error: "Title and at least one video required" });
    }

    // Generate unique code
    let code = generateCode();
    let exists = await db
      .select()
      .from(videoLibrary)
      .where(eq(videoLibrary.code, code))
      .limit(1);

    while (exists.length > 0) {
      code = generateCode();
      exists = await db
        .select()
        .from(videoLibrary)
        .where(eq(videoLibrary.code, code))
        .limit(1);
    }

    // Create session
    const [session] = await db
      .insert(videoLibrary)
      .values({
        code,
        title,
        videos: videos,
      })
      .returning();

    res.json({ code, session });
  } catch (error) {
    console.error("Error creating video library session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get session by code
router.get("/api/video-library/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const [session] = await db
      .select()
      .from(videoLibrary)
      .where(eq(videoLibrary.code, code.toUpperCase()))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ session });
  } catch (error) {
    console.error("Error fetching video library session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Delete session
router.delete("/api/video-library/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.body;

    // Check password
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const result = await db
      .delete(videoLibrary)
      .where(eq(videoLibrary.code, code.toUpperCase()))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting video library session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// Get all sessions (for admin)
router.post("/api/video-library/list", async (req, res) => {
  try {
    const { password } = req.body;

    // Check password
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const sessions = await db
      .select()
      .from(videoLibrary)
      .orderBy(videoLibrary.createdAt);

    res.json({ sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

export default router;
