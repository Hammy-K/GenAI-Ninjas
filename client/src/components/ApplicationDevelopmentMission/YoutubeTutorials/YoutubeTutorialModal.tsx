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
        className="max-w-3xl w-[95vw] p-0 overflow-hidden"
        aria-describedby={undefined}
        dir="rtl"
      >
        <DialogHeader className="p-5 md:p-6 pb-3 border-b border-gray-100">
          <DialogTitle className="text-xl md:text-2xl">{title}</DialogTitle>
          {description && (
            <p className="mt-2 text-gray-600 text-sm">{description}</p>
          )}
        </DialogHeader>

        <div className="p-5 md:p-6">
          <YouTubeTutorialPlayer videoId={videoId} />
          <p className="mt-3 text-xs text-gray-500">
            يمكنك إغلاق هذه النافذة والعودة إلى التمرين في أي وقت.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
