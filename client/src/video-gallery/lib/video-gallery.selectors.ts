import { ALL_CATEGORIES, CATEGORY_BY_SLUG } from "../content";
import { Category, Video } from "../content/video-gallery.types";

export function getAllCategories(): Category[] {
  return ALL_CATEGORIES;
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORY_BY_SLUG[slug];
}

export function getVideosByCategory(slug: string): Video[] {
  return getCategory(slug)?.videos ?? [];
}

export function getVideoBySlug(
  categorySlug: string,
  videoSlug: string,
): Video | undefined {
  const cat = getCategory(categorySlug);

  return cat?.videos.find((v) => v.slug === videoSlug);
}

export function getNextPrevInCategory(
  categorySlug: string,
  videoSlug: string,
): { prev?: Video; next?: Video } {
  const videos = getVideosByCategory(categorySlug);

  const i = videos.findIndex((v) => v.slug === videoSlug);

  if (i === -1) return {};

  return {
    prev: i > 0 ? videos[i - 1] : undefined,
    next: i < videos.length - 1 ? videos[i + 1] : undefined,
  };
}
