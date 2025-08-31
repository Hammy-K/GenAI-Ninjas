import { FrontendProject } from "@/services/application-development/frontend.service";
import { useQuery } from "@tanstack/react-query";

async function fetchById(id: number | string): Promise<FrontendProject> {
  const res = await fetch(
    `/api/app-dev/frontend/${encodeURIComponent(String(id))}`,
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");

    throw new Error(msg || `فشل تحميل المشروع (status ${res.status})`);
  }

  return res.json() as Promise<FrontendProject>;
}

export function useFrontendProject(
  id: number | string | undefined,
  enabled = false,
) {
  return useQuery<FrontendProject>({
    queryKey: ["appdev", "frontend", "project", id],
    queryFn: () => fetchById(id as string | number),
    enabled: enabled && !!id,
    staleTime: 0,
  });
}
