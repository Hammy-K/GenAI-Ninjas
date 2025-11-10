import { useState, useEffect, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useClipsList, useToggleClipVoteGlobal } from "./clips.hooks";
import ClipsPageHeader from "./components/ClipsPageHeader";
import ClipsViewSwitch from "./components/ClipsViewSwitch";
import ClipCard from "./components/ClipCard";
import { useGoogleAuth } from "@/google-auth/useGoogleAuth";
import { Button } from "@/components/ui/button";
import { Clip, ClipWithMeta } from "./clips.types";
import { HeartIcon, LaughIcon, User, X } from "lucide-react";

export default function ClipsSubmissionsPage() {
  const [view, setView] = useState<"featured" | "all">("featured");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const isFeatured = view === "featured";

  // pagination
  const [page, setPage] = useState(1);
  const limit = 30;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, isFeatured]);

  const { email, signInWithGoogle } = useGoogleAuth();

  const { data, isLoading, isFetching, isError, error } = useClipsList({
    isFeatured,
    search: debouncedSearch,
    limit,
    page,
    viewerEmail: email,
  });

  const toggleVote = useToggleClipVoteGlobal(email);

  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // --- Modal state ---
  const [open, setOpen] = useState(false);
  const [activeClip, setActiveClip] = useState<ClipWithMeta | null>(null);

  const onOpenClip = useCallback((clip: ClipWithMeta) => {
    setActiveClip(clip);
    setOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
    // let the close animation complete before clearing to avoid flicker
    setTimeout(() => setActiveClip(null), 150);
  }, []);

  // for accessibility: lock scroll when modal open (simple approach)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f2e8]">
      <div className="max-w-6xl mx-auto px-4 pb-6 pt-4">
        <ClipsPageHeader
          title="معرض المقاطع"
          subtitle="استعرض المقاطع وقدّم تفاعلك"
        />

        <div className="flex flex-col items-center justify-between gap-3 mb-4 flex-wrap">
          <ClipsViewSwitch view={view} onChange={setView} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث…"
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[280px]"
          />
        </div>

        {isLoading && (
          <div className="text-center text-gray-500 py-12">جارٍ التحميل…</div>
        )}

        {isError && (
          <div className="text-center text-red-600 py-12">
            {error?.message ?? "تعذّر التحميل. حاول مرة أخرى"}
          </div>
        )}

        {!isLoading && rows.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            لا توجد مقاطع حاليًا
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows.map((clip) => {
            const onVote = async (type: "heart" | "laugh") => {
              if (!email) {
                await signInWithGoogle();
                return;
              }
              try {
                await toggleVote.mutateAsync({ clipId: clip.id, type });
              } catch (e) {
                console.error(e);
              }
            };

            // OPEN IN MODAL INSTEAD OF NEW TAB
            const onOpen = (c: ClipWithMeta) => onOpenClip(c);

            return (
              <ClipCard
                key={clip.id}
                clip={clip}
                onVote={onVote}
                onOpen={onOpen}
              />
            );
          })}
        </div>

        {/* Light “updating” hint */}
        {isFetching && !isLoading && (
          <div className="text-center text-gray-400 mt-3">جارٍ التحديث…</div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex justify-between gap-4 mt-6 w-full">
            <Button
              disabled={page === 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>

            <span className="self-center">
              الصفحة {page} من {totalPages} ({total} مقطع)
            </span>

            <Button
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              التالي
            </Button>
          </div>
        )}
      </div>

      {/* -------- Modal Viewer -------- */}
      <ClipModal open={open} onClose={onClose} clip={activeClip} />
    </div>
  );
}

/** Simple, dependency-free modal. */
function ClipModal({
  open,
  onClose,
  clip,
}: {
  open: boolean;
  onClose: () => void;
  clip: ClipWithMeta | null;
}) {
  const [canPlay, setCanPlay] = useState(true);

  useEffect(() => {
    // reset playability state when clip changes or modal re-opens
    setCanPlay(true);
  }, [clip, open]);

  if (!open || !clip) return null;

  const isVideo = /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(clip.clipUrl);

  console.log("-------------------------");
  console.log(clip);
  console.log("-------------------------");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Dim background */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog card */}
      <div className="relative z-[101] w-[92vw] max-w-3xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold truncate">
              {clip.title}
            </h2>

            {clip.studentName && (
              <div className="flex items-center gap-2 mt-1 text-sm opacity-95">
                <User className="w-4 h-4" />
                <span className="font-medium">{clip.studentName}</span>
              </div>
            )}

            {clip.schoolName && (
              <p className="text-xs text-white/80 mt-0.5">{clip.schoolName}</p>
            )}

            {clip.trackStudentEmail && (
              <p className="text-xs text-white/80 mt-0.5">
                {clip.trackStudentEmail}
              </p>
            )}

            <div>
              <div className="px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5 transition-all">
                <HeartIcon />
                <span className={clip.hasHeart ? "font-semibold" : ""}>
                  {clip.heartCount}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5 transition-all">
                <LaughIcon />
                <span className={clip.hasLaugh ? "font-semibold" : ""}>
                  {clip.laughCount}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 truncate">
              {new Date(clip.createdAt).toLocaleString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4">
          {isVideo && canPlay ? (
            <video
              key={clip.clipUrl} // ensure reload per clip
              src={clip.clipUrl}
              controls
              playsInline
              className="w-full h-[52vw] max-h-[60vh] bg-black rounded-md"
              onError={() => setCanPlay(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <p className="text-gray-700 text-sm text-center">
                لا يمكن تشغيل الفيديو داخل الصفحة.
              </p>
              <a
                href={clip.clipUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white"
              >
                فتح في تبويب جديد
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { useDebounce } from "@/hooks/useDebounce";
// import { useClipsList, useToggleClipVoteGlobal } from "./clips.hooks";
// import ClipsPageHeader from "./components/ClipsPageHeader";
// import ClipsViewSwitch from "./components/ClipsViewSwitch";
// import ClipCard from "./components/ClipCard";
// import { useGoogleAuth } from "@/google-auth/useGoogleAuth";
// import { Button } from "@/components/ui/button";
// import { Clip } from "./clips.types";

// export default function ClipsSubmissionsPage() {
//   const [view, setView] = useState<"featured" | "all">("featured");
//   const [search, setSearch] = useState("");
//   const debouncedSearch = useDebounce(search, 400);
//   const isFeatured = view === "featured";

//   // NEW: pagination state
//   const [page, setPage] = useState(1);
//   const limit = 30;

//   // Reset to first page when filters change
//   useEffect(() => {
//     setPage(1);
//   }, [debouncedSearch, isFeatured]);

//   const { email, signInWithGoogle } = useGoogleAuth();

//   const { data, isLoading, isFetching, isError, error } = useClipsList({
//     isFeatured,
//     search: debouncedSearch,
//     limit,
//     page, // NEW
//     viewerEmail: email,
//   });

//   const toggleVote = useToggleClipVoteGlobal(email);

//   const rows = data?.rows ?? [];
//   const total = data?.count ?? 0;
//   const totalPages = Math.max(1, Math.ceil(total / limit));

//   return (
//     <div dir="rtl" className="min-h-screen bg-[#f5f2e8]">
//       <div className="max-w-6xl mx-auto px-4 pb-6 pt-4">
//         <ClipsPageHeader
//           title="معرض المقاطع"
//           subtitle="استعرض المقاطع وقدّم تفاعلك"
//         />

//         <div className="flex flex-col items-center justify-between gap-3 mb-4 flex-wrap">
//           <ClipsViewSwitch view={view} onChange={setView} />

//           <input
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="ابحث…"
//             className="px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[280px]"
//           />
//         </div>

//         {isLoading && (
//           <div className="text-center text-gray-500 py-12">جارٍ التحميل…</div>
//         )}

//         {isError && (
//           <div className="text-center text-red-600 py-12">
//             {error?.message ?? "تعذّر التحميل. حاول مرة أخرى"}
//           </div>
//         )}

//         {!isLoading && rows.length === 0 && (
//           <div className="text-center text-gray-500 py-16">
//             لا توجد مقاطع حاليًا
//           </div>
//         )}

//         {/* Grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//           {rows.map((clip) => {
//             const onVote = async (type: "heart" | "laugh") => {
//               if (!email) {
//                 await signInWithGoogle();
//                 return;
//               }
//               try {
//                 await toggleVote.mutateAsync({ clipId: clip.id, type });
//               } catch (e) {
//                 console.error(e);
//               }
//             };

//             const onOpen = (c: Clip) => window.open(c.clipUrl, "_blank");

//             return (
//               <ClipCard
//                 key={clip.id}
//                 clip={clip}
//                 onVote={onVote}
//                 onOpen={onOpen}
//               />
//             );
//           })}
//         </div>

//         {/* Light “updating” hint */}
//         {isFetching && !isLoading && (
//           <div className="text-center text-gray-400 mt-3">جارٍ التحديث…</div>
//         )}

//         {/* Pagination */}
//         {total > 0 && (
//           <div className="flex justify-between gap-4 mt-6 w-full">
//             <Button
//               disabled={page === 1 || isFetching}
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//             >
//               السابق
//             </Button>

//             <span className="self-center">
//               الصفحة {page} من {totalPages} ({total} مقطع)
//             </span>

//             <Button
//               disabled={page >= totalPages || isFetching}
//               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//             >
//               التالي
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
