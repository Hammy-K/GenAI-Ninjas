import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, ArrowLeft, Send, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVideoFlowContext } from "../contexts/VideoFlowContext";

interface SubmissionPageProps {
  onBack: () => void;
}

// Form validation schema
const submissionSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  link: z.string().url("يجب إدخال رابط صحيح").min(1, "الرابط مطلوب"),
  projectName: z.string().min(1, "اسم المشروع مطلوب").max(100, "اسم المشروع طويل جداً"),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export function SubmissionPage({ onBack }: SubmissionPageProps) {
  const { user } = useVideoFlowContext();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      email: user?.email || "",
      link: "",
      projectName: "",
    },
  });

  const onSubmit = async (data: SubmissionFormData) => {
    if (!user?.email) {
      setError("لم يتم العثور على بريد إلكتروني للمستخدم");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submission = {
        email: data.email,
        link: data.link,
        projectName: data.projectName,
      };

      const response = await fetch("/api/video-submissions/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit project");
      }

      const result = await response.json();
      console.log("Project submitted successfully:", result);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Failed to submit project:", err);
      setError("حدث خطأ أثناء إرسال المشروع. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-2xl p-8 shadow-lg text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              تم إرسال مشروعك بنجاح!
            </h2>
            <p className="text-green-700 mb-6">
              شكراً لك على مشاركة مشروعك معنا. سنقوم بمراجعته قريباً.
            </p>
            <Button
              onClick={onBack}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 py-3"
              data-testid="button-back-to-videos"
            >
              العودة للفيديوهات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Submission form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-xl">
            <Send className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            أرسل مشروعك
          </h2>
          <p className="text-gray-600">
            شارك مشروعك النهائي معنا لمراجعته وتقييمه
          </p>
        </div>

        {/* Submission Form */}
        <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-6 shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
                data-testid="input-email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Project Link Field */}
            <div className="space-y-2">
              <Label htmlFor="link" className="text-sm font-medium text-gray-700">
                رابط المشروع <span className="text-red-500">*</span>
              </Label>
              <Input
                id="link"
                type="url"
                placeholder="https://example.com/your-project"
                {...register("link")}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                data-testid="input-project-link"
              />
              {errors.link && (
                <p className="text-red-500 text-sm">{errors.link.message}</p>
              )}
            </div>

            {/* Project Name Field */}
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-sm font-medium text-gray-700">
                اسم المشروع <span className="text-red-500">*</span>
              </Label>
              <Input
                id="projectName"
                type="text"
                placeholder="مثال: تطبيق إدارة المهام"
                {...register("projectName")}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                data-testid="input-project-name"
              />
              {errors.projectName && (
                <p className="text-red-500 text-sm">{errors.projectName.message}</p>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg disabled:opacity-50"
              data-testid="button-submit-project"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الإرسال...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  إرسال المشروع
                </div>
              )}
            </Button>
          </form>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="w-full h-12 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl"
            data-testid="button-back-to-scenes"
          >
            <ArrowLeft className="ml-2 w-4 h-4" />
            العودة للمشاهد
          </Button>
        </div>

        {/* Form Guidelines */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-4 shadow-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">ℹ️</span>
            تعليمات المشروع
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>تأكد أن رابط المشروع يعمل ويمكن الوصول إليه</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>اختر اسماً واضحاً ومناسباً لمشروعك</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>سيتم إرسال إشعار بالبريد الإلكتروني عند مراجعة المشروع</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}