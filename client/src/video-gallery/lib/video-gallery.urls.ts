export const buildYouTubeEmbedUrl = (id: string) =>
  `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&enablejsapi=1`;

export const buildYouTubeThumbUrl = (id: string) =>
  `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

/** /missions/videos/:category/:videoSlug */
export const buildVideoRoute = (categorySlug: string, videoSlug: string) =>
  `/missions/videos/${encodeURIComponent(categorySlug)}/${encodeURIComponent(
    videoSlug,
  )}`;
