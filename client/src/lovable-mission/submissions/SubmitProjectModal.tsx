import { useEffect, useMemo, useState } from "react";
import {
  CustomDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLovableAuth } from "../auth/AuthProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitted?: (payload: {
    id?: number;
    studentName: string;
    noonCode?: string;
    projectTitle: string;
    projectLink: string;
    createdAt?: string;
  }) => void;
  onToast?: (args: { type: "success" | "error"; message: string }) => void;
  defaultStudentName?: string;
  defaultNoonCode?: string;
};

export function SubmitProjectModal({
  open,
  onClose,
  onSubmitted,
  onToast,
  defaultStudentName = "",
  defaultNoonCode = "",
}: Props) {
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [noonCode, setNoonCode] = useState(defaultNoonCode);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false); // show inline errors only after first submit
  const { user } = useLovableAuth();

  // reset on open
  useEffect(() => {
    if (open) {
      setStudentName(defaultStudentName);
      setNoonCode(defaultNoonCode);
      setProjectTitle("");
      setProjectLink("");
      setSubmitting(false);
      setAttempted(false);
    }
  }, [open, defaultStudentName, defaultNoonCode]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    // if (!studentName.trim()) e.studentName = "الاسم مطلوب";

    // if (!noonCode.trim()) e.noonCode = "كود نون مطلوب";

    if (!projectTitle.trim()) e.projectTitle = "عنوان المشروع مطلوب";

    if (!projectLink.trim()) {
      e.projectLink = "رابط المشروع مطلوب";
    } else {
      try {
        const url = new URL(projectLink);

        const ok =
          url.protocol === "https:" &&
          (projectLink.startsWith("https://lovable.dev/projects") ||
            projectLink.includes("lovable.app"));

        if (!ok) e.projectLink = "الرجاء إدخال رابط صالح من Lovable";
      } catch {
        e.projectLink = "الرابط غير صالح";
      }
    }

    return e;
  }, [projectTitle, projectLink]);

  const firstErrorMessage = useMemo(() => {
    const keys = Object.keys(errors);

    return keys.length ? errors[keys[0]] : null;
  }, [errors]);

  const handleSubmit = async () => {
    setAttempted(true);

    // UX: allow click but block submit with a toast if invalid
    if (firstErrorMessage) {
      onToast?.({ type: "error", message: firstErrorMessage });

      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/genai/lovable/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: user?.displayName,
          email: user?.email,
          // noonCode: noonCode.trim(),
          projectTitle: projectTitle.trim(),
          projectLink: projectLink.trim(),
        }),
      });

      if (!res.ok) throw new Error("Create failed");

      const data = await res.json();

      onToast?.({ type: "success", message: "تم حفظ المشروع بنجاح" });

      onSubmitted?.(data);

      onClose();
    } catch {
      onToast?.({ type: "error", message: "تعذر حفظ المشروع" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="bg-background" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            📤 إرسال مشروع Lovable
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            عبّئ البيانات لحفظ مشروعك في النظام
          </DialogDescription>
        </DialogHeader>

        {/* Form body — labels on top, consistent with student modal */}
        <div className="grid gap-4 py-2">
          {/* 
          <div className="grid gap-2">
            <Label htmlFor="studentName">اسم الطالب</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="مثال: علي محمد"
              className="bg-background border-border rounded-lg"
              aria-invalid={attempted && !!errors.studentName}
            />
            {attempted && errors.studentName && (
              <p className="text-red-600 text-xs">{errors.studentName}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="noonCode">كود نون</Label>
            <Input
              id="noonCode"
              value={noonCode}
              onChange={(e) => setNoonCode(e.target.value)}
              placeholder="مثال: N1234"
              className="bg-background border-border rounded-lg"
            />

            {attempted && errors.noonCode && (
              <p className="text-red-600 text-xs">{errors.noonCode}</p>
            )}
          </div> */}

          <div className="grid gap-2">
            <Label htmlFor="projectTitle">عنوان المشروع</Label>
            <Input
              id="projectTitle"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="مثال: مساعد الدراسة الذكي"
              className="bg-background border-border rounded-lg"
              aria-invalid={attempted && !!errors.projectTitle}
            />
            {attempted && errors.projectTitle && (
              <p className="text-red-600 text-xs">{errors.projectTitle}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="projectLink">رابط المشروع</Label>
            <Input
              id="projectLink"
              type="url"
              value={projectLink}
              onChange={(e) => setProjectLink(e.target.value)}
              placeholder="https://xxx.lovable.app"
              className="bg-background border-border rounded-lg"
              aria-invalid={attempted && !!errors.projectLink}
            />
            {attempted && errors.projectLink && (
              <p className="text-red-600 text-xs">{errors.projectLink}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>
            {submitting ? "جارٍ الحفظ..." : "حفظ المشروع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </CustomDialog>
  );
}
