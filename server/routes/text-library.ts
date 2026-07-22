import { Router } from "express";
import { db } from "../db";
import { textLibrary } from "../../shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Admin password from environment variable
const ADMIN_PASSWORD = process.env.TEXT_LIBRARY_ADMIN_PASSWORD;

// Validate that password is configured
if (!ADMIN_PASSWORD) {
  console.warn(
    "WARNING: TEXT_LIBRARY_ADMIN_PASSWORD environment variable is not set. " +
      "Admin endpoints will reject all requests."
  );
}

// Generate random 6-character code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Create a new text library session
router.post("/api/text-library", async (req, res) => {
  try {
    if (!ADMIN_PASSWORD) {
      return res
        .status(500)
        .json({ error: "Admin password not configured on server" });
    }

    const { password, title, texts } = req.body;

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }

    if (!title || !texts || !Array.isArray(texts) || texts.length === 0) {
      return res
        .status(400)
        .json({ error: "Title and at least one text required" });
    }

    let code = generateCode();
    let exists = await db
      .select()
      .from(textLibrary)
      .where(eq(textLibrary.code, code))
      .limit(1);

    while (exists.length > 0) {
      code = generateCode();
      exists = await db
        .select()
        .from(textLibrary)
        .where(eq(textLibrary.code, code))
        .limit(1);
    }

    const [session] = await db
      .insert(textLibrary)
      .values({
        code,
        title,
        texts: texts,
      })
      .returning();

    res.json({ code, session });
  } catch (error) {
    console.error("Error creating text library session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get session by code
router.get("/api/text-library/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const [session] = await db
      .select()
      .from(textLibrary)
      .where(eq(textLibrary.code, code.toUpperCase()))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ session });
  } catch (error) {
    console.error("Error fetching text library session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Delete session
router.delete("/api/text-library/:code", async (req, res) => {
  try {
    if (!ADMIN_PASSWORD) {
      return res
        .status(500)
        .json({ error: "Admin password not configured on server" });
    }

    const { code } = req.params;
    const { password } = req.body;

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const result = await db
      .delete(textLibrary)
      .where(eq(textLibrary.code, code.toUpperCase()))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting text library session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// Get all sessions (for admin)
router.post("/api/text-library/list", async (req, res) => {
  try {
    if (!ADMIN_PASSWORD) {
      return res
        .status(500)
        .json({ error: "Admin password not configured on server" });
    }

    const { password } = req.body;

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const sessions = await db
      .select()
      .from(textLibrary)
      .orderBy(textLibrary.createdAt);

    res.json({ sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

export default router;
