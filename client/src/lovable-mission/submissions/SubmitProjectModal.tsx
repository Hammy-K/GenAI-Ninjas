import { useEffect, useMemo, useState } from "react";

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
  /**
   * Optional toast hook/handler. If provided, called like:
   * onToast({ type: "success" | "error", message: string })
   */
  onToast?: (args: { type: "success" | "error"; message: string }) => void;

  // Optionals to prefill (e.g., from profile/cookies)
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

  useEffect(() => {
    if (open) {
      setStudentName(defaultStudentName);
      setNoonCode(defaultNoonCode);
      setProjectTitle("");
      setProjectLink("");
      setSubmitting(false);
    }
  }, [open, defaultStudentName, defaultNoonCode]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!studentName.trim()) e.studentName = "الاسم مطلوب";

    if (!projectTitle.trim()) e.projectTitle = "عنوان المشروع مطلوب";

    if (!projectLink.trim()) {
      e.projectLink = "رابط المشروع مطلوب";
    } else {
      try {
        const url = new URL(projectLink);

        const ok =
          url.protocol === "https:" &&
          (url.hostname.endsWith("lovable.app") ||
            url.hostname.endsWith("lovable.dev"));

        if (!ok) e.projectLink = "الرجاء إدخال رابط صالح من Lovable";
      } catch {
        e.projectLink = "الرابط غير صالح";
      }
    }
    return e;
  }, [studentName, projectTitle, projectLink]);

  const canSubmit = useMemo(
    () => !submitting && Object.keys(errors).length === 0,
    [submitting, errors],
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);

    try {
      const res = await fetch("/genai/lovable/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          noonCode: noonCode.trim() || undefined,
          projectTitle: projectTitle.trim(),
          projectLink: projectLink.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Create failed");
      }

      const data = await res.json();

      onToast?.({ type: "success", message: "تم حفظ المشروع بنجاح" });

      onSubmitted?.(data);

      onClose();
    } catch (err) {
      onToast?.({ type: "error", message: "تعذر حفظ المشروع" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40"
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base font-semibold">إرسال مشروع Lovable</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">اسم الطالب</label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="مثال: علي محمد"
            />
            {errors.studentName && (
              <p className="mt-1 text-xs text-red-600">{errors.studentName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              كود نون (اختياري)
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={noonCode}
              onChange={(e) => setNoonCode(e.target.value)}
              placeholder="مثال: N1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              عنوان المشروع
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="مثال: مساعد الدراسة الذكي"
            />
            {errors.projectTitle && (
              <p className="mt-1 text-xs text-red-600">{errors.projectTitle}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              رابط المشروع
            </label>
            <input
              type="url"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={projectLink}
              onChange={(e) => setProjectLink(e.target.value)}
              placeholder="https://xxx.lovable.app"
            />
            {errors.projectLink && (
              <p className="mt-1 text-xs text-red-600">{errors.projectLink}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`rounded-md px-3 py-2 text-sm text-white ${
              canSubmit ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-300"
            }`}
          >
            {submitting ? "جارٍ الحفظ..." : "حفظ المشروع"}
          </button>
        </div>
      </div>
    </div>
  );
}
