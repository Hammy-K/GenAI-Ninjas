import { useState, useCallback, useMemo } from "react";
import { Heart, Laugh, User, Calendar } from "lucide-react";
import { Clip, ClipWithMeta } from "../clips.types";

type Props = {
  clip: ClipWithMeta;
  onVote: (type: "heart" | "laugh") => void;
  onOpen?: (clip: Clip) => void;
};

export const HeartIcon = ({ pressed }: { pressed: boolean }) =>
  pressed ? (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        fill="#dc2626"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
           2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.59 4.81
           14.26 4 16 4 18.5 4 20.5 6 20.5 8.5c0 3.78-3.4 6.86-8.05
           11.54L12 21.35z"
      />
    </svg>
  ) : (
    <Heart className="w-4 h-4" color="#ffffff" strokeWidth={2} />
  );

export const LaughIcon = ({ pressed }: { pressed: boolean }) =>
  pressed ? (
    <span
      role="img"
      aria-label="laughing"
      className="text-[16px] leading-none select-none"
    >
      😂
    </span>
  ) : (
    <Laugh className="w-4 h-4" color="#ffffff" strokeWidth={2} />
  );

export default function ClipCard({ clip, onVote, onOpen }: Props) {
  const [failed, setFailed] = useState(false);

  const handleCardClick = useCallback(() => onOpen?.(clip), [clip, onOpen]);

  const handleHeartClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onVote("heart");
    },
    [onVote],
  );

  const handleLaughClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onVote("laugh");
    },
    [onVote],
  );

  const formattedDate = useMemo(() => {
    try {
      return new Date(clip.createdAt).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }, [clip.createdAt]);

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl
                 transform hover:scale-[1.02] transition-all duration-300 border border-purple-100"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      {/* Background flourishes */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-violet-200/30 to-transparent rounded-full blur-xl group-hover:animate-pulse" />
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full blur-lg" />

      {/* Media area with fixed height like before */}
      <div className="relative h-60 bg-gradient-to-br from-gray-100 to-gray-200">
        {/* Video as background */}
        {!failed ? (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={clip.clipUrl}
            muted
            playsInline
            autoPlay
            loop
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-indigo-200" />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none text-white">
          {/* TOP: Title first (like before), then optional student/school */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-2">{clip.title}</h3>

            {clip.studentName && (
              <div className="flex items-center gap-2 mt-1 text-sm opacity-95">
                <User className="w-4 h-4" />
                <span className="font-medium">{clip.studentName}</span>
              </div>
            )}

            {clip.schoolName && (
              <p className="text-xs text-white/80 mt-0.5">{clip.schoolName}</p>
            )}
          </div>

          {/* BOTTOM: reactions left, date right */}
          <div className="flex items-end justify-between gap-3">
            {/* Reactions — keep look as before */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                className={`px-3 py-1.5 rounded-lg text-white text-sm inline-flex items-center gap-1.5 transition-all
                            ${clip.hasHeart ? "hover:bg-red-400 shadow-lg scale-105" : "bg-white/20 hover:bg-red-500 hover:text-white border border-white/30 backdrop-blur-sm"}`}
                onClick={handleHeartClick}
                aria-pressed={!!clip.hasHeart}
                title={clip.hasHeart ? "إلغاء الإعجاب" : "أعجبني"}
              >
                <HeartIcon pressed={!!clip.hasHeart} />
                <span className={clip.hasHeart ? "font-semibold" : ""}>
                  {clip.heartCount}
                </span>
              </button>

              <button
                className={`px-3 py-1.5 rounded-lg text-white text-sm inline-flex items-center gap-1.5 transition-all
                            ${clip.hasLaugh ? "hover:bg-yellow-600 shadow-lg scale-105" : "bg-white/20 hover:bg-yellow-500 hover:text-white border border-white/30 backdrop-blur-sm"}`}
                onClick={handleLaughClick}
                aria-pressed={!!clip.hasLaugh}
                title={clip.hasLaugh ? "إزالة الضحكة" : "مضحك"}
              >
                <LaughIcon pressed={!!clip.hasLaugh} />
                <span className={clip.hasLaugh ? "font-semibold" : ""}>
                  {clip.laughCount}
                </span>
              </button>
            </div>

            {/* Date (optional) */}
            {formattedDate && (
              <div className="hidden sm:flex items-center gap-2 text-xs bg-white/10 px-2 py-1 rounded-full pointer-events-auto">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// import { useState, useCallback, useMemo } from "react";
// import { Heart, Laugh } from "lucide-react";
// import { Clip, ClipWithMeta } from "../clips.types";

// const HeartIcon = ({ pressed }: { pressed: boolean }) =>
//   pressed ? (
//     <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
//       <path
//         fill="#dc2626"
//         d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
//            2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.59 4.81
//            14.26 4 16 4 18.5 4 20.5 6 20.5 8.5c0 3.78-3.4 6.86-8.05
//            11.54L12 21.35z"
//       />
//     </svg>
//   ) : (
//     <Heart className="w-4 h-4" color="#ffffff" strokeWidth={2} />
//   );

// const LaughIcon = ({ pressed }: { pressed: boolean }) =>
//   pressed ? (
//     <span
//       role="img"
//       aria-label="laughing"
//       className="text-[16px] leading-none select-none"
//     >
//       😂
//     </span>
//   ) : (
//     <Laugh className="w-4 h-4" color="#ffffff" strokeWidth={2} />
//   );

// type Props = {
//   clip: ClipWithMeta;
//   onVote: (type: "heart" | "laugh") => void;
//   onOpen?: (clip: Clip) => void;
// };

// export default function ClipCard({ clip, onVote, onOpen }: Props) {
//   const [failed, setFailed] = useState(false);

//   const handleCardClick = useCallback(() => onOpen?.(clip), [clip, onOpen]);
//   const handleHeartClick = useCallback(
//     (e: React.MouseEvent) => {
//       e.stopPropagation();
//       e.preventDefault();
//       onVote("heart");
//     },
//     [onVote],
//   );
//   const handleLaughClick = useCallback(
//     (e: React.MouseEvent) => {
//       e.stopPropagation();
//       e.preventDefault();
//       onVote("laugh");
//     },
//     [onVote],
//   );

//   const formattedDate = useMemo(
//     () =>
//       new Date(clip.createdAt).toLocaleDateString("ar-EG", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//         hour: "numeric",
//         minute: "numeric",
//         hour12: true,
//       }),
//     [clip.createdAt],
//   );

//   return (
//     <div className="relative h-60 rounded-xl overflow-hidden shadow-md group">
//       {/* Background: video preview, fallback to gradient */}
//       <div className="absolute inset-0">
//         {/* Fallback layer (visible if video fails) */}
//         <div
//           className={`absolute inset-0 transition-opacity ${
//             failed ? "opacity-100" : "opacity-0"
//           } bg-gradient-to-br from-purple-200 to-indigo-200`}
//         />
//         {/* Video layer */}
//         {!failed && (
//           <video
//             key={clip.clipUrl} // reload if URL changes
//             className="absolute inset-0 w-full h-full object-cover"
//             src={clip.clipUrl}
//             playsInline
//             muted
//             loop
//             autoPlay
//             preload="metadata"
//             onError={() => setFailed(true)}
//           />
//         )}
//       </div>

//       {/* Overlay gradient */}
//       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

//       {/* Clickable top section (to open modal) */}
//       <button
//         type="button"
//         className="absolute top-0 left-0 right-0 h-32 cursor-pointer"
//         onClick={handleCardClick}
//         aria-label={`فتح المقطع: ${clip.title}`}
//       />

//       {/* Overlayed content */}
//       <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
//         <div className="text-white">
//           <h3 className="font-semibold text-lg line-clamp-2">{clip.title}</h3>
//           {clip.studentName && (
//             <p className="text-sm text-white/90 mt-1">{clip.studentName}</p>
//           )}
//           {clip.schoolName && (
//             <p className="text-xs text-white/70 mt-0.5">{clip.schoolName}</p>
//           )}
//         </div>

//         <div className="flex items-end justify-between gap-3">
//           {/* Reactions */}
//           <div className="flex items-center gap-2 pointer-events-auto">
//             <button
//               className="px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/50 shadow text-white text-sm inline-flex items-center justify-center gap-1.5 transition-colors"
//               onClick={handleHeartClick}
//               aria-pressed={!!clip.hasHeart}
//             >
//               <HeartIcon pressed={!!clip.hasHeart} />
//               <span className={clip.hasHeart ? "font-semibold text-white" : ""}>
//                 {clip.heartCount}
//               </span>
//             </button>

//             <button
//               className="px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/50 shadow text-white text-sm inline-flex items-center justify-center gap-1.5 transition-colors"
//               onClick={handleLaughClick}
//               aria-pressed={!!clip.hasLaugh}
//             >
//               <LaughIcon pressed={!!clip.hasLaugh} />
//               <span className={clip.hasLaugh ? "font-semibold text-white" : ""}>
//                 {clip.laughCount}
//               </span>
//             </button>
//           </div>

//           {/* Date */}
//           <button
//             type="button"
//             className="text-white text-xs text-right cursor-pointer pointer-events-auto bg-black/10 px-2 py-1 rounded-lg"
//             onClick={handleCardClick}
//             aria-label="فتح المقطع"
//           >
//             {formattedDate}
//           </button>
//         </div>
//       </div>

//       <div className="absolute inset-0 ring-0 group-hover:ring-2 group-hover:ring-purple-400/50 transition pointer-events-none" />
//     </div>
//   );
// }

// import { useState, useCallback, useMemo } from "react";
// import { Heart, Laugh } from "lucide-react";
// import { Clip, ClipWithMeta } from "../clips.types";

// const HeartIcon = ({ pressed }: { pressed: boolean }) =>
//   pressed ? (
//     <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
//       <path
//         fill="#dc2626"
//         d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
//            2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.59 4.81
//            14.26 4 16 4 18.5 4 20.5 6 20.5 8.5c0 3.78-3.4 6.86-8.05
//            11.54L12 21.35z"
//       />
//     </svg>
//   ) : (
//     <Heart className="w-4 h-4" color="#ffffff" strokeWidth={2} />
//   );

// const LaughIcon = ({ pressed }: { pressed: boolean }) =>
//   pressed ? (
//     <span
//       role="img"
//       aria-label="laughing"
//       className="text-[16px] leading-none select-none"
//     >
//       😂
//     </span>
//   ) : (
//     <Laugh className="w-4 h-4" color="#ffffff" strokeWidth={2} />
//   );

// type Props = {
//   clip: ClipWithMeta;
//   onVote: (type: "heart" | "laugh") => void;
//   onOpen?: (clip: Clip) => void;
// };

// export default function ClipCard({ clip, onVote, onOpen }: Props) {
//   const [failed, setFailed] = useState(false);

//   const handleCardClick = useCallback(() => onOpen?.(clip), [clip, onOpen]);
//   const handleHeartClick = useCallback(
//     (e: React.MouseEvent) => {
//       e.stopPropagation();
//       e.preventDefault();
//       onVote("heart");
//     },
//     [onVote],
//   );
//   const handleLaughClick = useCallback(
//     (e: React.MouseEvent) => {
//       e.stopPropagation();
//       e.preventDefault();
//       onVote("laugh");
//     },
//     [onVote],
//   );

//   const bgStyle = useMemo(() => {
//     if (failed) return {};
//     return { backgroundImage: `url(${clip.clipUrl})` };
//   }, [clip.clipUrl, failed]);

//   const formattedDate = useMemo(
//     () =>
//       new Date(clip.createdAt).toLocaleDateString("ar-EG", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//         hour: "numeric",
//         minute: "numeric",
//         hour12: true,
//       }),
//     [clip.createdAt],
//   );

//   return (
//     <div className="relative h-60 rounded-xl overflow-hidden shadow-md group">
//       {/* Background (video frame URL or placeholder) */}
//       <div
//         className={`absolute inset-0 bg-center bg-cover ${
//           failed
//             ? "bg-gradient-to-br from-purple-200 to-indigo-200"
//             : "bg-gray-200"
//         }`}
//         style={bgStyle}
//       >
//         {/* fallback image trigger (hidden) */}
//         <img
//           src={clip.clipUrl}
//           alt=""
//           className="hidden"
//           onError={() => setFailed(true)}
//         />
//       </div>

//       {/* Overlay gradient */}
//       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

//       {/* Clickable top section */}
//       <div
//         className="absolute top-0 left-0 right-0 h-32 cursor-pointer"
//         onClick={handleCardClick}
//         role="button"
//         tabIndex={0}
//       />

//       {/* Overlayed content */}
//       <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
//         <div className="text-white">
//           <h3 className="font-semibold text-lg line-clamp-2">{clip.title}</h3>
//           {clip.studentName && (
//             <p className="text-sm text-white/90 mt-1">{clip.studentName}</p>
//           )}
//           {clip.schoolName && (
//             <p className="text-xs text-white/70 mt-0.5">{clip.schoolName}</p>
//           )}
//         </div>

//         <div className="flex items-end justify-between gap-3">
//           {/* Reactions */}
//           <div className="flex items-center gap-2 pointer-events-auto">
//             <button
//               className="px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/50 shadow text-white text-sm inline-flex items-center justify-center gap-1.5 transition-colors"
//               onClick={handleHeartClick}
//               aria-pressed={!!clip.hasHeart}
//             >
//               <HeartIcon pressed={!!clip.hasHeart} />
//               <span className={clip.hasHeart ? "font-semibold text-white" : ""}>
//                 {clip.heartCount}
//               </span>
//             </button>

//             <button
//               className="px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/50 shadow text-white text-sm inline-flex items-center justify-center gap-1.5 transition-colors"
//               onClick={handleLaughClick}
//               aria-pressed={!!clip.hasLaugh}
//             >
//               <LaughIcon pressed={!!clip.hasLaugh} />
//               <span className={clip.hasLaugh ? "font-semibold text-white" : ""}>
//                 {clip.laughCount}
//               </span>
//             </button>
//           </div>

//           {/* Date */}
//           <div
//             className="text-white text-xs text-right cursor-pointer pointer-events-auto"
//             onClick={handleCardClick}
//             role="button"
//             tabIndex={0}
//           >
//             <p className="bg-black/10 px-2 py-1 rounded-lg">{formattedDate}</p>
//           </div>
//         </div>
//       </div>

//       <div className="absolute inset-0 ring-0 group-hover:ring-2 group-hover:ring-purple-400/50 transition pointer-events-none" />
//     </div>
//   );
// }
