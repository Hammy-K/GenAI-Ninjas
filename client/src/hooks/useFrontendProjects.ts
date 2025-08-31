import {
  FrontendListParams,
  FrontendProject,
  listFeaturedFrontendProjects,
  listFrontendProjects,
  Paginated,
} from "@/services/application-development/frontend.service";
import { useQuery } from "@tanstack/react-query";

type UseFrontendProjectsArgs = FrontendListParams & { featured?: boolean };

export function useFrontendProjects(args: UseFrontendProjectsArgs) {
  const { featured, ...rest } = args;

  return useQuery<Paginated<FrontendProject>>({
    queryKey: [
      "appdev",
      "frontend",
      featured ? "featured" : "all",
      rest.organization,
      rest.page ?? 1,
      rest.limit ?? 30,
      rest.search ?? "",
      rest.mission ?? "",
      rest.sortBy ?? "createdAt",
      rest.sortOrder ?? "desc",
    ],
    queryFn: () =>
      featured
        ? listFeaturedFrontendProjects(rest)
        : listFrontendProjects(rest),
    // keepPreviousData: true,
    staleTime: 0,
  });
}
