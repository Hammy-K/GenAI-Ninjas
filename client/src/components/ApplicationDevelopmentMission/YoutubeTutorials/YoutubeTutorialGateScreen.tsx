import YouTubeTutorialPlayer from "./YouTubeTutorialPlayer";
import { setTutorialSeen, type TutorialKeyParts } from "./tutorialSeenStore";

type Props = TutorialKeyParts & {
  videoId: string;
  title: string;
  description?: string;
  onDismiss: () => void; // called after marking as seen
  primaryCtaText?: string;
  secondaryCtaText?: string;
  showSkip?: boolean;
};

export default function YoutubeTutorialGateScreen({
  org,
  mainMission,
  mission,
  videoId,
  title,
  description,
  onDismiss,
  primaryCtaText = "ابدأ التمرين",
  secondaryCtaText = "شاهد لاحقًا",
  showSkip = true,
}: Props) {
  const handleDismiss = () => {
    setTutorialSeen({ org, mainMission, mission }, videoId);
    onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-white flex flex-col"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 p-2 md:p-2 mx-auto flex items-center flex-col">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
        <button
          type="button"
          onClick={handleDismiss}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
        >
          {primaryCtaText}
        </button>
      </div>

      {/* Body (scrollable when needed, but video height capped by viewport) */}
      <div className="grow min-h-0 overflow-auto p-5 md:p-6">
        <div className="flex flex-col items-center gap-4">
          {/* 
            Width constraint ensures aspect-video height ≤ ~62vh.
            You can adjust 62vh up/down to fit your header/footer.
          */}
          <div
            className="w-full max-w-5xl"
            style={{ width: "min(100%, calc(62vh * 16 / 9))" }}
          >
            <YouTubeTutorialPlayer
              videoId={videoId}
              title="Tutorial"
              // you can optionally pass a className for extra styling if needed
              // className="rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Footer / actions */}
      <div className="shrink-0 p-4 md:p-2 pt-0 flex flex-col gap-3">
        <div className="flex items-center gap-2 w-full justify-center">
          {/* <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            {primaryCtaText}
          </button> */}

          {/* {showSkip && (
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              {secondaryCtaText}
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
}
