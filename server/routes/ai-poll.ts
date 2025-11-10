import { Router } from "express";
import { db } from "../db";
import { aiPollSessions, aiPollVotes } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Admin password (change this!)
const ADMIN_PASSWORD = process.env.AI_POLL_PASSWORD || "admin123";

// Middleware to verify password
function verifyPassword(req: any, res: any, next: any) {
  const password = req.body.password || req.query.password;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
  }

  next();
}

// Generate a random 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET /api/ai-poll/sessions - Get all sessions (with password)
router.get("/sessions", verifyPassword, async (req, res) => {
  try {
    const sessionsData = await db.query.aiPollSessions.findMany({
      with: {
        votes: true,
      },
      orderBy: (sessions) => [desc(sessions.createdAt)],
    });

    // Format sessions with vote count
    const sessions = sessionsData.map((session) => ({
      id: session.id,
      code: session.code,
      title: session.title,
      correctAnswer: session.correctAnswer,
      status: session.status,
      createdAt: session.createdAt,
      voteCount: session.votes.length,
    }));

    res.json({ success: true, sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// POST /api/ai-poll/create-session - Create a new poll session (with password)
router.post("/create-session", verifyPassword, async (req, res) => {
  try {
    const { title, videoEmbed, correctAnswer } = req.body;

    if (!title || !videoEmbed || !correctAnswer) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    let code = generateCode();
    let existing = await db.query.aiPollSessions.findFirst({
      where: eq(aiPollSessions.code, code),
    });

    while (existing) {
      code = generateCode();
      existing = await db.query.aiPollSessions.findFirst({
        where: eq(aiPollSessions.code, code),
      });
    }

    const [session] = await db
      .insert(aiPollSessions)
      .values({
        code,
        title,
        videoEmbed,
        correctAnswer,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.json({ success: true, session });
  } catch (error) {
    console.error("Error creating poll session:", error);
    res.status(500).json({ error: "Failed to create poll session" });
  }
});

// GET /api/ai-poll/teachers - Get list of teachers
router.get("/teachers", async (req, res) => {
  try {
    // You can modify these lists as needed
    const maleTeachers = [
      "أ. محمد العتيبي",
      "أ. أحمد السعيد",
      "أ. خالد الشمري",
      "أ. عبدالله الغامدي",
      "أ. سعد القحطاني",
      "معلم آخر - (اكتب الاسم)",
    ];

    const femaleTeachers = [
      "أ. فاطمة الزهراني",
      "أ. نورة العمري",
      "أ. سارة الدوسري",
      "أ. هند المطيري",
      "أ. ريم الحربي",
      "معلمة أخرى - (اكتبي الاسم)",
    ];

    res.json({ male: maleTeachers, female: femaleTeachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

// GET /api/ai-poll/session/:identifier - Get session by ID or code
router.get("/session/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to parse as ID first, otherwise treat as code
    const isNumeric = /^\d+$/.test(identifier);

    let session;
    if (isNumeric) {
      session = await db.query.aiPollSessions.findFirst({
        where: eq(aiPollSessions.id, parseInt(identifier)),
      });
    } else {
      session = await db.query.aiPollSessions.findFirst({
        where: eq(aiPollSessions.code, identifier),
      });
    }

    if (!session) {
      return res.status(404).json({ error: "الجلسة غير موجودة" });
    }

    // Don't send correctAnswer to students
    const { correctAnswer, ...sessionData } = session;

    res.json(sessionData);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// POST /api/ai-poll/session/:id/vote - Submit a vote
router.post("/session/:id/vote", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const {
      studentName,
      teacherName,
      teacherNameOther,
      gender,
      selectedAnswer,
    } = req.body;

    if (!studentName || !teacherName || !gender || !selectedAnswer) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    const session = await db.query.aiPollSessions.findFirst({
      where: eq(aiPollSessions.id, sessionId),
    });

    if (!session) {
      return res.status(404).json({ error: "الجلسة غير موجودة" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ error: "الجلسة مغلقة" });
    }

    // Check if student already voted
    const existingVote = await db.query.aiPollVotes.findFirst({
      where: and(
        eq(aiPollVotes.sessionId, sessionId),
        eq(aiPollVotes.studentName, studentName),
      ),
    });

    if (existingVote) {
      return res
        .status(400)
        .json({ error: "لقد قمت بالتصويت مسبقاً في هذه الجلسة" });
    }

    const isCorrect = selectedAnswer === session.correctAnswer;
    const finalTeacherName = teacherName.includes("أخر")
      ? teacherNameOther
      : teacherName;

    const [vote] = await db
      .insert(aiPollVotes)
      .values({
        sessionId,
        studentName,
        teacherName: finalTeacherName,
        gender,
        selectedAnswer,
        isCorrect,
        votedAt: new Date(),
      })
      .returning();

    res.json({ success: true, isCorrect, vote });
  } catch (error) {
    console.error("Error submitting vote:", error);
    res.status(500).json({ error: "Failed to submit vote" });
  }
});

// POST /api/ai-poll/session/:id/stats - Get statistics (with password)
router.post("/session/:id/stats", verifyPassword, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    const session = await db.query.aiPollSessions.findFirst({
      where: eq(aiPollSessions.id, sessionId),
      with: {
        votes: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: "الجلسة غير موجودة" });
    }

    const votes = session.votes;
    const totalVotes = votes.length;
    const votesA = votes.filter((v) => v.selectedAnswer === "A").length;
    const votesB = votes.filter((v) => v.selectedAnswer === "B").length;
    const correctVotes = votes.filter((v) => v.isCorrect).length;
    const maleVotes = votes.filter((v) => v.gender === "male").length;
    const femaleVotes = votes.filter((v) => v.gender === "female").length;

    // Teacher breakdown
    const teacherBreakdown: any = {};
    votes.forEach((vote) => {
      const teacher = vote.teacherName;
      if (!teacherBreakdown[teacher]) {
        teacherBreakdown[teacher] = {
          total: 0,
          correct: 0,
          answerA: 0,
          answerB: 0,
        };
      }
      teacherBreakdown[teacher].total++;
      if (vote.isCorrect) teacherBreakdown[teacher].correct++;
      if (vote.selectedAnswer === "A") teacherBreakdown[teacher].answerA++;
      if (vote.selectedAnswer === "B") teacherBreakdown[teacher].answerB++;
    });

    const statistics = {
      totalVotes,
      votesA,
      votesB,
      percentageA:
        totalVotes > 0 ? ((votesA / totalVotes) * 100).toFixed(1) : "0",
      percentageB:
        totalVotes > 0 ? ((votesB / totalVotes) * 100).toFixed(1) : "0",
      correctVotes,
      percentageCorrect:
        totalVotes > 0 ? ((correctVotes / totalVotes) * 100).toFixed(1) : "0",
      maleVotes,
      femaleVotes,
      percentageMale:
        totalVotes > 0 ? ((maleVotes / totalVotes) * 100).toFixed(1) : "0",
      percentageFemale:
        totalVotes > 0 ? ((femaleVotes / totalVotes) * 100).toFixed(1) : "0",
      teacherBreakdown,
    };

    res.json({
      session: {
        id: session.id,
        code: session.code,
        title: session.title,
        correctAnswer: session.correctAnswer,
        status: session.status,
      },
      statistics,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// POST /api/ai-poll/session/:id/close - Close a poll session (with password)
router.post("/session/:id/close", verifyPassword, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    const [session] = await db
      .update(aiPollSessions)
      .set({
        status: "closed",
        updatedAt: new Date(),
      })
      .where(eq(aiPollSessions.id, sessionId))
      .returning();

    if (!session) {
      return res.status(404).json({ error: "الجلسة غير موجودة" });
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error("Error closing session:", error);
    res.status(500).json({ error: "Failed to close session" });
  }
});

// DELETE /api/ai-poll/session/:id - Delete a session (with password)
router.delete("/session/:id", verifyPassword, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    // Delete all votes first
    await db.delete(aiPollVotes).where(eq(aiPollVotes.sessionId, sessionId));

    // Delete session
    const [session] = await db
      .delete(aiPollSessions)
      .where(eq(aiPollSessions.id, sessionId))
      .returning();

    if (!session) {
      return res.status(404).json({ error: "الجلسة غير موجودة" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

export default router;
