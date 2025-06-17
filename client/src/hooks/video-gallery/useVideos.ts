import { fetchVideos } from "@/services/videoService";
import { useQuery } from "@tanstack/react-query";

export const useVideos = () => {
  return useQuery({
    queryKey: ["videos"],
    queryFn: () => fetchVideos(),
  });
};
