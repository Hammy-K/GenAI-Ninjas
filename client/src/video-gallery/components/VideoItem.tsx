import { Play, Eye } from "lucide-react";
import { Link } from "wouter";
import { Video } from "../content/video-gallery.types";
import {
  buildVideoRoute,
  buildYouTubeThumbUrl,
} from "../lib/video-gallery.urls";

type Props = {
  categorySlug: string;
  video: Video;
};

export default function VideoItem({ categorySlug, video }: Props) {
  const thumb = buildYouTubeThumbUrl(video.id);
  const href = buildVideoRoute(categorySlug, video.slug);

  return (
    <Link to={href}>
      <a
        aria-label={`مشاهدة: ${video.title}`}
        className="group block relative bg-white rounded-2xl p-4 shadow hover:shadow-xl border border-purple-100 transition overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-400"
      >
        <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3">
          <img
            src={thumb}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <div className="bg-white/90 rounded-full p-3 shadow">
              <Play className="w-6 h-6 text-violet-600" />
            </div>
          </div>

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute top-2 right-2 text-[11px] px-2 pt-1 rounded-full bg-black/70 text-white">
              {video.duration}
            </div>
          )}
        </div>

        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
          {video.title}
        </h3>

        {video.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {video.description}
          </p>
        )}

        {/* Visual CTA (non-interactive) */}
        <div className="pointer-events-none mt-3 w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition group-hover:opacity-95">
          {/* <Play className="w-4 h-4" /> */}
          <span>مشاهدة</span>
          {/* <Eye className="w-4 h-4" /> */}
        </div>
      </a>
    </Link>
  );
}

// import { Play, Eye } from "lucide-react";
// import { Link } from "wouter";
// import { Video } from "../content/video-gallery.types";
// import {
//   buildVideoRoute,
//   buildYouTubeThumbUrl,
// } from "../lib/video-gallery.urls";

// type Props = {
//   categorySlug: string;
//   video: Video;
// };

// export default function VideoItem({ categorySlug, video }: Props) {
//   const thumb = buildYouTubeThumbUrl(video.id);

//   return (
//     <div className="group relative bg-white rounded-2xl p-4 shadow hover:shadow-xl border border-purple-100 transition overflow-hidden">
//       <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3">
//         <img
//           src={thumb}
//           alt={video.title}
//           className="w-full h-full object-cover"
//           loading="lazy"
//         />
//         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
//           <div className="bg-white/90 rounded-full p-3 shadow">
//             <Play className="w-6 h-6 text-violet-600" />
//           </div>
//         </div>

//         {video.duration && (
//           <div className="absolute top-2 right-2 text-[11px] px-2 pt-1 rounded-full bg-black/70 text-white">
//             {video.duration ?? "فيديو"}
//           </div>
//         )}
//       </div>

//       <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
//         {video.title}
//       </h3>

//       {video.description && (
//         <p className="text-sm text-gray-600 line-clamp-2">
//           {video.description}
//         </p>
//       )}

//       <Link to={buildVideoRoute(categorySlug, video.slug)}>
//         <button className="mt-3 w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-600 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 transition">
//           <Play className="w-4 h-4" />
//           <span>مشاهدة</span>
//           <Eye className="w-4 h-4" />
//         </button>
//       </Link>
//     </div>
//   );
// }
