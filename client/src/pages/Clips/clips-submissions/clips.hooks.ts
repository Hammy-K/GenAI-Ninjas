import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getClipsByEmailApi, listClipsApi, toggleVoteApi } from "./clips.api";
import type {
  ClipListResponse,
  ClipVoteType,
  ClipWithMeta,
} from "./clips.types";

/** List clips (supports search / featured / paging) */
export function useClipsList(args: {
  search?: string;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
  viewerEmail?: string | null;
}) {
  return useQuery<ClipListResponse>({
    queryKey: [
      "clips",
      args.search ?? "",
      args.isFeatured ?? "all",
      args.page ?? 1,
      args.limit ?? 30,
      args.viewerEmail ?? "",
    ],
    queryFn: () => listClipsApi(args),
    staleTime: 0,
  });
}

/**
 * Global mutation for toggling votes (no optimistic update).
 * Use once per page; pass { clipId, type } at call time.
 */
export function useToggleClipVoteGlobal(email: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { clipId: number; type: ClipVoteType }) => {
      if (!email) throw new Error("auth_required");

      return toggleVoteApi(vars.clipId, {
        trackStudentEmail: email,
        type: vars.type,
      });
    },
    onSuccess: () => {
      // Refresh lists after vote to update counts
      qc.invalidateQueries({ queryKey: ["clips"] });
    },
  });
}

export function useMyLatestClip(email: string | null) {
  return useQuery<ClipWithMeta | null>({
    queryKey: ["clips", "mine", email ?? ""],
    enabled: !!email,
    queryFn: async () => {
      const res = await getClipsByEmailApi(email!, 1);

      return (res.rows && res.rows[0]) || null;
    },
    staleTime: 0,
  });
}
