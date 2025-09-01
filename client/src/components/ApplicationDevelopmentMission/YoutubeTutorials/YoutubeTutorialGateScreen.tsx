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
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      role=""
      aria-modal="true"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200">
        <div className="p-5 md:p-6 border-b border-gray-100">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          {description && <p className="mt-2 text-gray-600">{description}</p>}
        </div>

        <div className="p-5 md:p-6">
          <YouTubeTutorialPlayer videoId={videoId} />
          <ul className="mt-4 text-sm text-gray-600 list-disc pr-5 space-y-1">
            <li>الفيديو قصير ويساعدك على فهم فكرة المهمة بسرعة.</li>
            <li>يمكنك دائمًا إعادة مشاهدة الشرح من الزر العائم لاحقًا.</li>
          </ul>
        </div>

        <div className="p-5 md:p-6 pt-0 flex flex-col md:flex-row gap-3 justify-between">
          <div className="text-xs text-gray-500">
            المهمة: <span className="font-medium">{mission}</span> · البرنامج:{" "}
            <span className="font-medium">{mainMission}</span> · المؤسسة:{" "}
            <span className="font-medium">{org}</span>
          </div>

          <div className="flex items-center gap-2">
            {showSkip && (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                {secondaryCtaText}
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              {primaryCtaText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
