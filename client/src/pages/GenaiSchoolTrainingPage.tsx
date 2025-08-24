import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useGenaiTrainingSubmit } from "@/hooks/useSubmitGenaiSchoolTraining";
import { LogosHeader } from "@/components/common/LogosHeader";
import { SchoolSelect } from "@/components/common/SelectSchool";

type FormState = {
  selectedSchool: { id: number | "other" | null; label: string } | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  city: string;
  note: string;
};

export default function GenaiTrainingRegisterPage() {
  const [state, setState] = useState<FormState>({
    selectedSchool: null,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    city: "",
    note: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = useGenaiTrainingSubmit();

  function validate(): string | null {
    if (!state.contactName.trim()) return "الاسم مطلوب";

    if (!state.contactPhone.trim()) return "رقم الجوال مطلوب";

    if (
      !/^(?:[0-9٠-٩]{10}|\+9665[0-9٠-٩]{8}|009665[0-9٠-٩]{8})$/.test(
        state.contactPhone,
      )
    ) {
      return "رقم الجوال يجب أن يكون 10 أرقام أو بصيغة 009665XXXXXXXX أو 009665XXXXXXXX";
    }

    if (
      state.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contactEmail)
    ) {
      return "صيغة البريد الإلكتروني غير صحيحة";
    }

    if (state.selectedSchool?.id === "other" && state.note.trim().length < 2) {
      return "فضلاً اكتب اسم المدرسة ضمن الملاحظات";
    }

    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setErrorMsg(null);

    const v = validate();

    if (v) {
      setErrorMsg(v);
      return;
    }

    const payload = {
      schoolId:
        typeof state.selectedSchool?.id === "number"
          ? state.selectedSchool?.id
          : null,
      contactName: state.contactName.trim(),
      contactPhone: state.contactPhone.trim(),
      contactEmail: state.contactEmail.trim() || undefined,
      city: state.city.trim() || undefined,
      note: state.note.trim() || undefined,
    };

    try {
      await submit.mutateAsync(payload);

      setShowSuccess(true);

      setState({
        selectedSchool: null,
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        city: "",
        note: "",
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "حدث خطأ غير متوقع");
    }
  }

  const isOther = state.selectedSchool?.id === "other";

  return (
    <div dir="rtl" className="min-h-screen font-tajawal bg-[#f5f2e8]">
      <div className="max-w-3xl mx-auto px-4 pb-8">
        <LogosHeader />

        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 mt-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-6">
            تسجيل اهتمام ببرنامج تدريب الذكاء الاصطناعي للمدارس
          </h1>

          {showSuccess && (
            <div className="mb-4 p-2 rounded-md bg-green-50 border border-green-200 flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span>تم استلام طلبك بنجاح. سنعود إليك قريباً.</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* الاسم + الجوال */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  value={state.contactName}
                  onChange={(e) =>
                    setState((s) => ({ ...s, contactName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="مثال: أحمد علي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الجوال
                </label>
                <input
                  inputMode="tel"
                  value={state.contactPhone}
                  onChange={(e) =>
                    setState((s) => ({ ...s, contactPhone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="05XXXXXXXX أو 009665XXXXXXXX"
                />
              </div>
            </div>

            {/* البريد */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                value={state.contactEmail}
                onChange={(e) =>
                  setState((s) => ({ ...s, contactEmail: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="name@example.com"
              />
            </div>

            {/* صف المدينة (1/4) + المدرسة (3/4) بعرض كامل */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:items-end">
              <SchoolSelect
                value={state.selectedSchool}
                onChange={(v) => setState((s) => ({ ...s, selectedSchool: v }))}
                className="sm:col-span-3"
              />

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المدينة
                </label>
                <input
                  value={state.city}
                  onChange={(e) =>
                    setState((s) => ({ ...s, city: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="مثال: الرياض"
                />
              </div>
            </div>

            {/* تنبيه "مدرسة أخرى" فوق الملاحظات مباشرة */}
            {isOther && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800 text-sm">
                لقد اخترت <strong>مدرسة أخرى</strong>. فضلاً اكتب اسم المدرسة
                بشكل واضح ضمن خانة <strong>الملاحظات</strong> أدناه.
              </div>
            )}

            {/* الملاحظات */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الملاحظات
              </label>
              <textarea
                rows={3}
                value={state.note}
                onChange={(e) =>
                  setState((s) => ({ ...s, note: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={
                  isOther
                    ? "أدخل اسم المدرسة هنا مع أي تفاصيل إضافية..."
                    : "أي تفاصيل أو ملاحظات إضافية"
                }
              />
            </div>

            <button
              type="submit"
              disabled={submit.isPending}
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-md font-medium transition-colors"
            >
              {submit.isPending ? "جارٍ الإرسال..." : "إرسال الطلب"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
