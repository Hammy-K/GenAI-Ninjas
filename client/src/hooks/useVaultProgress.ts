// src/hooks/useVaultProgress.ts
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { FrontendSubMission } from "@/types/frontend-types"; // adjust path as needed

interface VaultProgress {
  [key: string]: boolean;
}

export function useVaultProgress(organization: string) {
  const [progress, setProgress] = useState<VaultProgress>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const studentId = Cookies.get("studentId");

      if (!studentId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all missions for this student
        const missions: FrontendSubMission[] = [
          "inputs-outputs",
          "buttons-events",
          "random-selection",
          "conditional-logic",
          "layout-design",
          "dynamic-images",
        ];

        const progressMap: VaultProgress = {};

        // Check each mission
        for (const mission of missions) {
          const response = await fetch(
            `/api/app-dev/frontend?userId=${studentId}&organization=${organization}&mission=${mission}&limit=1`,
          );

          if (response.ok) {
            const data = await response.json();
            progressMap[mission] = data.data && data.data.length > 0;
          } else {
            progressMap[mission] = false;
          }
        }

        setProgress(progressMap);
      } catch (error) {
        console.error("Failed to fetch vault progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [organization]);

  return { progress, isLoading };
}
