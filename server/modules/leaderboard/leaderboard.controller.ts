import { LeaderboardModel } from "./leaderboard.model";
import { PromptChallengeScore, NewPromptChallengeScore } from "@shared/schema";

export const LeaderboardController = {
  async submitScore(
    studentName: string,
    score: number,
    prompt?: string,
  ): Promise<{ entry: PromptChallengeScore; rank: number }> {
    const entry = await LeaderboardModel.create({
      studentName,
      score,
      prompt,
    });

    const rank = await LeaderboardModel.getStudentRank(score);

    return { entry, rank };
  },

  async getLeaderboard(limit: number = 10): Promise<PromptChallengeScore[]> {
    return await LeaderboardModel.getTopScores(limit);
  },

  async getStudentBest(
    studentName: string,
  ): Promise<PromptChallengeScore | null> {
    return await LeaderboardModel.getStudentBestScore(studentName);
  },
};
