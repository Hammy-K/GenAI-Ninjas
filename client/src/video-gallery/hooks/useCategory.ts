import { useMemo } from "react";
import {
  getCategory,
  getVideosByCategory,
} from "../lib/video-gallery.selectors";

export function useCategory(slug: string | undefined) {
  const category = useMemo(
    () => (slug ? getCategory(slug) : undefined),
    [slug],
  );

  const videos = useMemo(() => (slug ? getVideosByCategory(slug) : []), [slug]);

  return { category, videos };
}
