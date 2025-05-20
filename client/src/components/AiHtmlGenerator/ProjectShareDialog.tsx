import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ProjectShareDialogProps = {
  open: boolean;
  projectId: string;
  onClose: () => void;
};

export function ProjectShareDialog({
  open,
  projectId,
  onClose,
}: ProjectShareDialogProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (projectId && typeof window !== "undefined") {
      const domain = window.location.origin;
      setShareUrl(`${domain}/project/${projectId}`);
    }
  }, [projectId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تم حفظ المشروع!</DialogTitle>
          <DialogDescription>
            تم حفظ مشروعك بنجاح. شارك الرابط أدناه لعرض إبداعك للآخرين.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mt-4" dir="rtl">
          <div className="grid flex-1 gap-2 mx-4">
            <Input readOnly value={shareUrl} className="text-xs" />
          </div>
          <Button
            type="button"
            size="sm"
            className={`px-3 mx-3 ${
              projectId && !copied
                ? "animate-pulse bg-green-100 hover:bg-green-200 text-green-800"
                : ""
            }`}
            onClick={copyToClipboard}
          >
            {copied ? "تم النسخ!" : "نسخ"}
          </Button>
        </div>

        <DialogFooter className="sm:justify-start mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
