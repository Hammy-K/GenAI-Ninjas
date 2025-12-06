import { db } from "server/db";
import { desc, eq } from "drizzle-orm";
import {
  promptChallengeScores,
  PromptChallengeScore,
  NewPromptChallengeScore,
} from "@shared/schema";

export const LeaderboardModel = {
  async create(data: NewPromptChallengeScore): Promise<PromptChallengeScore> {
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

  async getStudentBestScore(
    studentName: string,
  ): Promise<PromptChallengeScore | null> {
    const [row] = await db
      .select()
      .from(promptChallengeScores)
      .where(eq(promptChallengeScores.studentName, studentName))
      .orderBy(desc(promptChallengeScores.score))
      .limit(1);

    return row ?? null;
  },

  async getStudentRank(score: number): Promise<number> {
    const higherScores = await db
      .select()
      .from(promptChallengeScores)
      .where(eq(promptChallengeScores.score, score));

    // Count how many unique scores are higher
    const allScores = await db
      .select({ score: promptChallengeScores.score })
      .from(promptChallengeScores)
      .orderBy(desc(promptChallengeScores.score));

    const uniqueScores = [...new Set(allScores.map((r) => r.score))];
    const rank = uniqueScores.findIndex((s) => s <= score) + 1;

    return rank || uniqueScores.length + 1;
  },
};
