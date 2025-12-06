import { db } from "server/db";
import { desc, eq, sql } from "drizzle-orm";
import {
  promptChallengeScores,
  PromptChallengeScore,
  NewPromptChallengeScore,
} from "@shared/schema";

export const LeaderboardModel = {
  async upsertScore(
    data: NewPromptChallengeScore,
  ): Promise<PromptChallengeScore> {
    // Check if student already has an entry
    const [existing] = await db
      .select()
      .from(promptChallengeScores)
      .where(eq(promptChallengeScores.studentName, data.studentName))
      .limit(1);

    if (existing) {
      // Only update if new score is higher
      if (data.score > existing.score) {
        const [updated] = await db
          .update(promptChallengeScores)
          .set({
            score: data.score,
            prompt: data.prompt,
            createdAt: sql`now()`,
          })
          .where(eq(promptChallengeScores.id, existing.id))
          .returning();
        return updated;
      }
      return existing;
    }

    // Create new entry
    const [row] = await db
      .insert(promptChallengeScores)
      .values(data)
      .returning();
    return row;
  },

  async getTopScores(limit: number = 10): Promise<PromptChallengeScore[]> {
    const rows = await db
      .select()
      .from(promptChallengeScores)
      .orderBy(
        desc(promptChallengeScores.score),
        desc(promptChallengeScores.createdAt),
      )
      .limit(limit);

    return rows;
  },

  async getStudentScore(
    studentName: string,
  ): Promise<PromptChallengeScore | null> {
    const [row] = await db
      .select()
      .from(promptChallengeScores)
      .where(eq(promptChallengeScores.studentName, studentName))
      .limit(1);

    return row ?? null;
  },

  async getStudentRank(studentName: string): Promise<number> {
    const allScores = await db
      .select({
        studentName: promptChallengeScores.studentName,
        score: promptChallengeScores.score,
      })
      .from(promptChallengeScores)
      .orderBy(desc(promptChallengeScores.score));

    const rank = allScores.findIndex((r) => r.studentName === studentName) + 1;
    return rank || allScores.length + 1;
  },
};
