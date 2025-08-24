import { useQuery } from "@tanstack/react-query";

export type SchoolOption = { id: number; name: string; city: string | null };

async function fetchSchools(search: string): Promise<SchoolOption[]> {
  const params = new URLSearchParams({
    search,
    limit: "10",
    orderBy: "name",
    orderDirection: "asc",
  });

  const res = await fetch(`/api/schools?${params.toString()}`);

  if (!res.ok) throw new Error("فشل جلب المدارس");

  const data = (await res.json()) as { rows: any[] };

  return (data.rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city ?? null,
  }));
}

export function useSchoolsSearch(search: string) {
  return useQuery({
    queryKey: ["schools", search],
    queryFn: () => fetchSchools(search),
    enabled: search.trim().length > 0,
    staleTime: 0,
  });
}
