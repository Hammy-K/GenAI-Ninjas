import { useMemo } from "react";
import { getVideoBySlug } from "../lib/video-gallery.selectors";

export function useVideo(categorySlug?: string, videoSlug?: string) {
  const video = useMemo(() => {
    if (!categorySlug || !videoSlug) return undefined;

    return getVideoBySlug(categorySlug, videoSlug);
  }, [categorySlug, videoSlug]);

  return { video };
}
