import { LeaderboardModel } from "./leaderboard.model";
import { PromptChallengeScore, NewPromptChallengeScore } from "@shared/schema";

export const LeaderboardController = {
  async submitScore(
    studentName: string,
    score: number,
    prompt?: string,
  ): Promise<{
    entry: PromptChallengeScore;
    rank: number;
    isNewHighScore: boolean;
  }> {
    // Get existing score first
    const existing = await LeaderboardModel.getStudentScore(studentName);
    const isNewHighScore = !existing || score > existing.score;

    const entry = await LeaderboardModel.upsertScore({
      studentName,
      score,
      prompt,
    });

    const rank = await LeaderboardModel.getStudentRank(studentName);

    return { entry, rank, isNewHighScore };
  },

  async getLeaderboard(limit: number = 10): Promise<PromptChallengeScore[]> {
    return await LeaderboardModel.getTopScores(limit);
  },

  async getStudentScore(
    studentName: string,
  ): Promise<PromptChallengeScore | null> {
    return await LeaderboardModel.getStudentScore(studentName);
  },
};
