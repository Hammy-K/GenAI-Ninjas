import { useQuery } from "@tanstack/react-query";
import { fetchVideoEmbedUrl } from "@/services/videoService";

export const useVideoEmbedUrl = (fileId: string) => {
  return useQuery({
    queryKey: ["video", fileId],
    queryFn: () => fetchVideoEmbedUrl(fileId),
    enabled: !!fileId,
  });
};
