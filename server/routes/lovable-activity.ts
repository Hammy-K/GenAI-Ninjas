import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { logEvent, logError } from "../services";

export interface LovableSubmission {
  id: string;
  sessionId: string;
  appUrl: string;
  appTitle: string;
  studentName: string;
  studentId?: string;
  ideaData: {
    type: string | null;
    problem: string | null;
    audience: string | null;
    coreFeature: string | null;
    userFlow: string | null;
    style: string | null;
  };
  submittedAt: Date;
  votes: {
    creative: number;
    useful: number;
  };
}

// In-memory storage for submissions (could be moved to database in production)
let submissions: LovableSubmission[] = [];
let votingRecord: Map<string, Set<string>> = new Map(); // sessionId -> Set of appIds voted for

export function registerLovableActivityRoutes(router: Router, openai: OpenAI) {
  const lovableRoutes = Router();

  // Chat with Pengy endpoint
  lovableRoutes.post("/chat", async (req: Request, res: Response) => {
    try {
      const { messages, temperature = 0.7, maxTokens = 150 } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          error: "Messages array is required"
        });
      }

      const userMessage = messages[messages.length - 1];
      if (userMessage?.role === 'user') {
        logEvent("lovable_pengy_chat", userMessage.content, {
          message_count: messages.length,
          prompt_length: userMessage.content.length
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature,
        max_tokens: maxTokens
      });

      const message = response.choices[0].message.content || 
        "Sorry, I'm having trouble right now. Can you try rephrasing that?";

      return res.json({ message });
    } catch (error) {
      logError("lovable_pengy_chat", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({
        error: "Failed to process chat request"
      });
    }
  });

  // Submit app to showcase
  lovableRoutes.post("/submissions", async (req: Request, res: Response) => {
    try {
      const { 
        sessionId, 
        appUrl, 
        appTitle, 
        studentName, 
        studentId, 
        ideaData 
      } = req.body;

      if (!sessionId || !appUrl || !appTitle || !studentName) {
        return res.status(400).json({
          error: "Missing required fields: sessionId, appUrl, appTitle, studentName"
        });
      }

      // Validate URL format
      if (!appUrl.includes('lovable.dev')) {
        return res.status(400).json({
          error: "Invalid app URL - must be from lovable.dev"
        });
      }

      // Check if this session already submitted an app
      const existingSubmission = submissions.find(sub => sub.sessionId === sessionId);
      if (existingSubmission) {
        return res.status(400).json({
          error: "This session has already submitted an app"
        });
      }

      const submission: LovableSubmission = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        sessionId,
        appUrl,
        appTitle,
        studentName,
        studentId: studentId || undefined,
        ideaData: ideaData || {
          type: null,
          problem: null,
          audience: null,
          coreFeature: null,
          userFlow: null,
          style: null
        },
        submittedAt: new Date(),
        votes: {
          creative: 0,
          useful: 0
        }
      };

      submissions.push(submission);

      logEvent("lovable_app_submitted", appTitle, {
        student_name: studentName,
        app_url: appUrl,
        idea_type: ideaData?.type || 'unknown',
        session_id: sessionId
      });

      return res.json({ 
        success: true, 
        submissionId: submission.id 
      });
    } catch (error) {
      logError("lovable_submission", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({
        error: "Failed to submit app"
      });
    }
  });

  // Get all submissions for gallery
  lovableRoutes.get("/submissions", async (req: Request, res: Response) => {
    try {
      // Return submissions sorted by newest first
      const sortedSubmissions = [...submissions]
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        .map(sub => ({
          id: sub.id,
          title: sub.appTitle,
          studentName: sub.studentName,
          url: sub.appUrl,
          submittedAt: sub.submittedAt,
          votes: sub.votes
        }));

      return res.json(sortedSubmissions);
    } catch (error) {
      logError("lovable_submissions_fetch", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({
        error: "Failed to fetch submissions"
      });
    }
  });

  // Vote for an app
  lovableRoutes.post("/submissions/:id/vote", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { category } = req.body;
      const sessionId = req.session?.id || req.ip; // Use session ID or IP as voter identifier

      if (!category || (category !== 'creative' && category !== 'useful')) {
        return res.status(400).json({
          error: "Invalid category - must be 'creative' or 'useful'"
        });
      }

      // Find the submission
      const submission = submissions.find(sub => sub.id === id);
      if (!submission) {
        return res.status(404).json({
          error: "Submission not found"
        });
      }

      // Check if user has already voted for this app
      if (!votingRecord.has(sessionId)) {
        votingRecord.set(sessionId, new Set());
      }
      
      const userVotes = votingRecord.get(sessionId)!;
      const voteKey = `${id}_${category}`;
      
      if (userVotes.has(voteKey)) {
        return res.status(400).json({
          error: "You have already voted for this app in this category"
        });
      }

      // Record the vote
      userVotes.add(voteKey);
      submission.votes[category as 'creative' | 'useful']++;

      logEvent("lovable_app_vote", submission.appTitle, {
        category,
        voter_session: sessionId,
        app_id: id,
        total_creative_votes: submission.votes.creative,
        total_useful_votes: submission.votes.useful
      });

      return res.json({ 
        success: true, 
        votes: submission.votes 
      });
    } catch (error) {
      logError("lovable_vote", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({
        error: "Failed to record vote"
      });
    }
  });

  // Get submission statistics (for admin/analytics)
  lovableRoutes.get("/stats", async (req: Request, res: Response) => {
    try {
      const stats = {
        totalSubmissions: submissions.length,
        totalVotes: submissions.reduce((acc, sub) => 
          acc + sub.votes.creative + sub.votes.useful, 0),
        ideaTypes: submissions.reduce((acc, sub) => {
          const type = sub.ideaData.type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        topApps: {
          creative: [...submissions]
            .sort((a, b) => b.votes.creative - a.votes.creative)
            .slice(0, 5)
            .map(sub => ({
              title: sub.appTitle,
              studentName: sub.studentName,
              votes: sub.votes.creative
            })),
          useful: [...submissions]
            .sort((a, b) => b.votes.useful - a.votes.useful)
            .slice(0, 5)
            .map(sub => ({
              title: sub.appTitle,
              studentName: sub.studentName,
              votes: sub.votes.useful
            }))
        }
      };

      return res.json(stats);
    } catch (error) {
      logError("lovable_stats", error instanceof Error ? error : "Unknown error");
      return res.status(500).json({
        error: "Failed to fetch statistics"
      });
    }
  });

  // Mount lovable routes
  router.use("/lovable-activity", lovableRoutes);
}