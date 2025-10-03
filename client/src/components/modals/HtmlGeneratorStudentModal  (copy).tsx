// components/modals/HtmlGeneratorStudentModal.tsx
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useLovableAuth } from "@/lovable-mission/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CustomDialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/custom-dialog";

export default function HtmlGeneratorStudentModal() {
  const [open, setOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, isSigningIn, user } = useLovableAuth();

  useEffect(() => {
    const studentId = Cookies.get("studentId");
    if (!studentId) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (user?.email && open) {
      handleAuthWithEmail(user.email);
    }
  }, [user, open]);

  const handleAuthWithEmail = async (userEmail: string) => {
    setLoading(true);
    try {
      // 1. Check if email exists in tracks_students
      const trackRes = await fetch(`/api/tracks-students/by-email?email=${encodeURIComponent(userEmail)}`);

      if (!trackRes.ok) {
        toast({
          title: "البريد غير مسجل",
          description: "البريد الإلكتروني غير مسجل في النظام. يرجى التواصل مع المدرب.",
          variant: "destructive",
        });
        return;
      }

      const trackStudent = await trackRes.json();

      // 2. Create or get existing student record
      const studentRes = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          fullName: trackStudent.studentName || userEmail.split('@')[0],
          schoolName: trackStudent.school || "غير محدد",
          phoneNumber: "",
        }),
      });

      if (!studentRes.ok) {
        throw new Error("فشل في إنشاء سجل الطالب");
      }

      const student = await studentRes.json();

      // 3. Set cookie
      Cookies.set("studentId", student.id, { expires: 30 });

      localStorage.setItem("studentName", trackStudent.studentName || userEmail);
      localStorage.setItem("schoolName", trackStudent.school || "");
      localStorage.setItem("email", userEmail);

      toast({
        title: "مرحباً!",
        description: `أهلاً ${trackStudent.studentName || 'بك'}! تم تسجيل دخولك بنجاح.`,
      });

      setOpen(false);
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تسجيل الدخول",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الدخول بـ Google",
        variant: "destructive",
      });
    }
  };

  const handleManualEmailSubmit = async () => {
    if (!email.includes('@')) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      return;
    }
    await handleAuthWithEmail(email);
  };

  return (
    <CustomDialog open={open}>
      <DialogContent className="bg-white" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            أهلاً بك في منشئ الألعاب
          </DialogTitle>
        </DialogHeader>

        {authMode === 'google' ? (
          <div className="py-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || loading}
              className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-lg border border-gray-300 shadow-sm hover:shadow transition bg-white disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.4 0 19-8.4 19-19 0-1.3-.1-2.2-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.6 18.9 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 36 26.8 37 24 37c-5.3 0-9.7-3.1-11.6-7.5l-6.6 5C8.4 39.6 15.7 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.3-3.6 5.9-6.7 7.4l6.3 5.2C38.1 37.8 43 31.7 43.6 20.5z"/>
              </svg>
              <span className="font-medium">
                {isSigningIn ? "جاري تسجيل الدخول..." : "متابعة باستخدام Google"}
              </span>
            </button>

            <button
              onClick={() => setAuthMode('email')}
              className="w-full text-sm text-blue-600 hover:text-blue-700 underline"
              disabled={loading}
            >
              واجهت مشكلة في تسجيل الدخول؟ أدخل إيميلك يدوياً
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني المسجل في النظام</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="bg-white"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                استخدم البريد المسجل معنا في النظام
              </p>
            </div>

            <Button
              onClick={handleManualEmailSubmit}
              disabled={!email.includes('@') || loading}
              className="w-full"
            >
              {loading ? "جاري التحقق..." : "متابعة"}
            </Button>

            <button
              onClick={() => setAuthMode('google')}
              className="w-full text-sm text-gray-600 hover:text-gray-700"
              disabled={loading}
            >
              العودة لتسجيل الدخول بـ Google
            </button>
          </div>
        )}
      </DialogContent>
    </CustomDialog>
  );
}