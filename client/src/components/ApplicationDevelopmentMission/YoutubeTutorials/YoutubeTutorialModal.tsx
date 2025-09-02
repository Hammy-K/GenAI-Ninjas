import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import YouTubeTutorialPlayer from "./YouTubeTutorialPlayer";

type Props = {
  open: boolean;
  onClose: () => void;
  videoId: string;
  title?: string;
  description?: string;
};

export default function YoutubeTutorialModal({
  open,
  onClose,
  videoId,
  title = "شرح المهمة",
  description,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent
        className="max-w-3xl w-[95vw] p-0 overflow-hidden bg-white border-none"
        aria-describedby={undefined}
      >
        {/* <DialogHeader className="p-4 md:p-4 pb-2 border-b border-gray-100 bg-slate-200">
          <DialogTitle className="text-xl md:text-2xl">{title}</DialogTitle>
          {description && (
            <p className="mt-2 text-gray-600 text-sm">{description}</p>
          )}
        </DialogHeader> */}

        <div className="shrink-0 border-b border-gray-200 p-2 md:p-2 mx-auto flex items-center flex-col w-full mt-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {title}
          </h2>

          {description && <p className="mt-2 text-gray-600">{description}</p>}
        </div>

        <div className="p-4 md:p-4">
          <YouTubeTutorialPlayer videoId={videoId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
