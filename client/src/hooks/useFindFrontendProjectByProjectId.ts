import { FrontendProject } from "@/services/application-development/frontend.service";
import { useQuery } from "@tanstack/react-query";

async function fetchByProjectId(projectId: string): Promise<FrontendProject> {
  const res = await fetch(
    `/api/app-dev/frontend/projects/${encodeURIComponent(projectId)}`,
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `فشل تحميل المشروع (status ${res.status})`);
  }

  return res.json() as Promise<FrontendProject>;
}

export function useFindFrontendProjectByProjectId(
  projectId: string | undefined,
  enabled = false,
) {
  return useQuery<FrontendProject>({
    queryKey: ["appdev", "frontend", "projectByProjectId", projectId],
    queryFn: () => fetchByProjectId(projectId as string),
    enabled: enabled && !!projectId,
    staleTime: 0,
  });
}
