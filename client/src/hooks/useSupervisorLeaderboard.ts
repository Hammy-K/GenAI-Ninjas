import { useState, useEffect } from "react";

export interface SupervisorLeaderboardEntry {
  supervisor: string;
  avgVaultsCompleted: number;
  totalVaults: number;
  studentCount: number;
}

export function useSupervisorLeaderboard(organization: string) {
  const [leaderboard, setLeaderboard] = useState<SupervisorLeaderboardEntry[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(
          `/api/tracks-students/supervisor-leaderboard?organization=${organization}`,
        );

        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [organization]);

  return { leaderboard, isLoading };
}
