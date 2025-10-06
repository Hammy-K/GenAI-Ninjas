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

import { ls, storageKeys } from "@/student-auth/storage.utils";
import { clearAuthSession } from "@/student-auth/session.utils";

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

export function SubmitProjectModalV2({
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
  const [attempted, setAttempted] = useState(false);

  // reset on open — also hydrate from storage if defaults missing
  useEffect(() => {
    if (open) {
      const storedName = ls.get(storageKeys.studentName);
      setStudentName(defaultStudentName || storedName || "");
      setNoonCode(defaultNoonCode || "");
      setProjectTitle("");
      setProjectLink("");
      setSubmitting(false);
      setAttempted(false);
    }
  }, [open, defaultStudentName, defaultNoonCode]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

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

    // 🔐 Require authenticated identity from student-auth
    const name = (ls.get(storageKeys.studentName) || studentName || "").trim();
    const email = (ls.get(storageKeys.email) || "").trim();

    if (!name || !email) {
      onToast?.({
        type: "error",
        message:
          "أنت غير مسجل دخول أو انتهت الجلسة. الرجاء تسجيل الدخول ثم المحاولة مرة أخرى.",
      });
      clearAuthSession();
      window.location.reload();
      return;
    }

    // UX: allow click but block submit with a toast if invalid fields
    if (firstErrorMessage) {
      onToast?.({ type: "error", message: firstErrorMessage });
      return;
    }

    setSubmitting(true);
    try {
      const phoneNumber = ls.get(storageKeys.phoneNumber) || "";

      const res = await fetch("/api/genai/lovable/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: name,
          email,
          phoneNumber, // ✅ send phone in payload
          // noonCode: noonCode.trim(), // enable later if needed
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
      <DialogContent className="bg-white" dir="rtl">
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
          {/* Name/NoonCode inputs remain hidden to keep UX minimal; values come from storage. */}

          <div>
            {ls.get(storageKeys.studentName)}
            <br />
            {ls.get(storageKeys.email)}
            <br />
            {ls.get(storageKeys.phoneNumber)}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="projectTitle">عنوان المشروع</Label>
            <Input
              id="projectTitle"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="مثال: مساعد الدراسة الذكي"
              className="bg-white border-gray-300 rounded-lg"
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
              className="bg-white border-gray-300 rounded-lg"
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
