import { buildYouTubeEmbedUrl } from "../lib/video-gallery.urls";

export function useYouTubeEmbedUrl(youtubeId: string | undefined) {
  return { embedUrl: youtubeId ? buildYouTubeEmbedUrl(youtubeId) : undefined };
}
