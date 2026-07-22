import { useRoute } from "wouter";
import { useVideo } from "../hooks/useVideo";
import VideoPlayerHeader from "../components/VideoPlayerHeader";
import { AlertCircle, Play, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useYouTubeEmbedUrl } from "../hooks/useYoutubeEmbedUrl";
import {
  getCategory,
  getNextPrevInCategory,
} from "../lib/video-gallery.selectors";
import { buildVideoRoute } from "../lib/video-gallery.urls";

export default function VideoPlayerPage() {
  const [, params] =
    useRoute("/missions/videos/:categorySlug/:videoSlug") ||
    useRoute("/missions/videos/:categorySlug/:videoSlug/");

  const categorySlug = params?.categorySlug;
  const videoSlug = params?.videoSlug;

  const { video } = useVideo(categorySlug, videoSlug);
  const { embedUrl } = useYouTubeEmbedUrl(video?.id);
  const category = categorySlug ? getCategory(categorySlug) : undefined;
  const nav =
    video && categorySlug
      ? getNextPrevInCategory(categorySlug, video.slug)
      : {};

  if (!video || !category) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-6"
        dir="rtl"
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            الفيديو غير موجود
          </h2>
          <p className="text-muted">
            تحقق من الرابط أو عُد إلى صفحة المعرض.
          </p>
          <a
            href="/missions/videos"
            className="inline-flex mt-4 items-center justify-center bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-medium"
          >
            العودة للمعرض
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <VideoPlayerHeader categoryTitle={category.title} />

        <div className="mx-auto max-w-2xl mt-6">
          <div className="shrink-0 mb-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {video.title}
            </h2>
            {video.description && (
              <p className="mt-2 text-muted">{video.description}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow overflow-hidden border border-purple-100">
            <div className="relative bg-black">
              <div className="w-full aspect-video">
                <iframe
                  title={video.title}
                  src={embedUrl}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="lazy"
                  className="w-full h-full border-0"
                />
              </div>
              <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-black/70 text-white">
                <Play className="w-3 h-3 inline-block ml-1" />
                يتم التشغيل الآن
              </div>
            </div>

            {/* Three-way distribution: prev (right), spacer (center), next (left) */}
            <div className="p-4 bg-card border-t border-border">
              <div className="flex items-center justify-between gap-2">
                {/* السابق (right edge in RTL because it's the first item) */}
                {nav.prev ? (
                  <a
                    className="px-3 py-2 rounded-lg bg-white border border-border hover:bg-card text-foreground flex items-center gap-1"
                    href={buildVideoRoute(category.slug, nav.prev.slug)}
                  >
                    <ChevronsRight className="w-4 h-4" />
                    السابق
                  </a>
                ) : (
                  // Invisible placeholder to preserve spacing
                  <div className="px-3 py-2 rounded-lg opacity-0 pointer-events-none select-none">
                    placeholder
                  </div>
                )}

                {/* Center placeholder */}
                <div className="text-xs text-muted select-none">
                  {/* ضع تلميحًا هنا لاحقًا إن رغبت */}
                </div>

                {/* التالي (left edge in RTL because it's the last item) */}
                {nav.next ? (
                  <a
                    className="px-3 py-2 rounded-lg bg-white border border-border hover:bg-card text-foreground flex items-center gap-1"
                    href={buildVideoRoute(category.slug, nav.next.slug)}
                  >
                    التالي
                    <ChevronsLeft className="w-4 h-4" />
                  </a>
                ) : (
                  // Invisible placeholder to preserve spacing
                  <div className="px-3 py-2 rounded-lg opacity-0 pointer-events-none select-none">
                    placeholder
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
