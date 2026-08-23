
import React, { useEffect, useState } from "react";
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
import { toast, useToast } from "@/hooks/use-toast";
import { SchoolSelect } from "../common/SelectSchool";
import {
  getStudentIdCookie,
  setStudentIdCookie,
} from "@/student-auth/cookies.utils";

export default function HtmlGeneratorStudentModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "manual">("email");

  // Email step
  const [email, setEmail] = useState(() => localStorage.getItem("email") || "");
  const [emailLoading, setEmailLoading] = useState(false);

  // Manual step
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [studentGrade, setStudentGrade] = useState<string>(() => {
    return localStorage.getItem("studentGrade") || "";
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { toast } = useToast();
  const [schoolSelect, setSchoolSelect] = useState<{
    id: number | "other" | null;
    label: string;
  } | null>(null);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (schoolName === "مدرسة أخرى") {
      setSchoolName("");
    }
  }, [schoolName]);

  useEffect(() => {
    const studentId = getStudentIdCookie();
    if (!studentId) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    setIsValid(
      fullName.trim() !== "" &&
        schoolName.trim() !== "" &&
        schoolName.trim() !== "مدرسة أخرى" &&
        studentGrade.trim() !== "" &&
        /^05\d{8}$/.test(phoneNumber.trim()),
    );
  }, [fullName, schoolName, phoneNumber, studentGrade]);

  const handleEmailLookup = async () => {
    if (!isValidEmail(email)) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      return;
    }

    setEmailLoading(true);
    setErrorMsg("");

    try {
      // 1. Check tracks_students table
      const trackRes = await fetch(
        `/api/tracks-students/by-email?email=${encodeURIComponent(email)}`,
      );

      if (!trackRes.ok) {
        // Email not found - show manual entry
        toast({
          title: "البريد غير موجود",
          description: "لم نجد بريدك في النظام. يرجى ملء البيانات يدوياً.",
        });
        setStep("manual");
        return;
      }

      const trackStudent = await trackRes.json();

      // ADD THIS LOG
      console.log("Data from tracks_students:", trackStudent);
      console.log("Phone number:", trackStudent.phone_number);

      const studentData = {
        email: email,
        fullName: trackStudent.studentName || email.split("@")[0],
        schoolName: trackStudent.school || "غير محدد",
        phoneNumber: trackStudent.phoneNumber || "",
      };

      // ADD THIS LOG
      console.log("Sending to /api/students:", studentData);

      // 2. Create/get student record
      const studentRes = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          fullName: trackStudent.studentName || email.split("@")[0],
          schoolName: trackStudent.school || "غير محدد",
          phoneNumber: trackStudent.phoneNumber || "", // Direct use, no conversion needed
        }),
      });

      if (!studentRes.ok) {
        throw new Error("فشل في إنشاء سجل الطالب");
      }

      const student = await studentRes.json();

      // 3. Set cookie and localStorage
      setStudentIdCookie(student.id);

      localStorage.setItem("studentName", trackStudent.studentName || email);
      localStorage.setItem("schoolName", trackStudent.school || "");
      localStorage.setItem("email", email);

      toast({
        title: "🎉 أهلاً بك!",
        description: `مرحباً ${trackStudent.studentName || "بك"}! تم تسجيل دخولك بنجاح.`,
      });

      setOpen(false);
    } catch (error: any) {
      console.error("Email lookup error:", error);
      setErrorMsg("تعذّر التحقّق من بريدك الإلكتروني. تأكّد من كتابته بشكل صحيح ثم أعد المحاولة.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          schoolName,
          phoneNumber,
          email: email || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى.");
      }

      const data = await res.json();

      if (!data.id) {
        throw new Error("لم يتم العثور على معرف الطالب.");
      }

      setStudentIdCookie(data.id);

      localStorage.setItem("studentName", fullName);
      localStorage.setItem("studentGrade", studentGrade);
      localStorage.setItem("schoolName", schoolName);
      localStorage.setItem("phoneNumber", phoneNumber);
      if (email) localStorage.setItem("email", email);

      toast({
        title: "🎉 أهلاً بك!",
        description: `يا ${fullName} من ${schoolName}، تم تسجيلك بنجاح في النظام.`,
      });

      setOpen(false);
    } catch (error: any) {
      console.error("Student save error:", error);
      setErrorMsg("تعذّر حفظ بياناتك. تحقّق من اتصالك بالإنترنت وأعد المحاولة، وإن استمرّ الخطأ حدّث الصفحة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomDialog open={open}>
      <DialogContent className="bg-white" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            👋 أهلاً بك في تصميم التطبيقات!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {step === "email"
              ? "أدخل بريدك الإلكتروني للبدء"
              : "قبل ما نبدأ، نحتاج بعض المعلومات البسيطة"}
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          // Email lookup step
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  localStorage.setItem("email", e.target.value);
                }}
                placeholder="example@gmail.com"
                className={`bg-white border-gray-300 rounded-lg ${
                  email && !isValidEmail(email) ? "border-red-500" : ""
                }`}
                disabled={emailLoading}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleEmailLookup();
                  }
                }}
              />
              {email && !isValidEmail(email) && (
                <p className="text-red-500 text-xs">
                  صيغة البريد الإلكتروني غير صحيحة
                </p>
              )}
            </div>

            {errorMsg && (
              <p className="text-red-600 text-sm text-center">{errorMsg}</p>
            )}

            <Button
              onClick={handleEmailLookup}
              disabled={!isValidEmail(email) || emailLoading}
              className="w-full"
            >
              {emailLoading ? "جاري التحقق..." : "متابعة"}
            </Button>

            <button
              onClick={() => setStep("manual")}
              className="w-full text-sm text-blue-600 hover:text-blue-700 underline"
              disabled={emailLoading}
            >
              ليس لدي بريد إلكتروني أو أفضل الإدخال اليدوي
            </button>
          </div>
        ) : (
          // Manual entry step
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                الاسم الكامل
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="col-span-3 bg-white border-gray-300 rounded-lg"
                placeholder="...."
                required
              />
            </div>

            {/* Email field - readonly if coming from email step */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manualEmail" className="text-right">
                البريد الإلكتروني
              </Label>
              <Input
                id="manualEmail"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  localStorage.setItem("email", e.target.value);
                }}
                className={`col-span-3 bg-white border-gray-300 rounded-lg ${
                  email && !isValidEmail(email) ? "border-red-500" : ""
                }`}
                placeholder="example@gmail.com (اختياري)"
                disabled={email !== "" && step === "manual"}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schoolName" className="text-right">
                اسم المدرسة
              </Label>
              <SchoolSelect
                onChange={(value) => {
                  setSchoolSelect(value);
                  setSchoolName(value.label);
                }}
                value={schoolSelect}
                showLabel={false}
                className="w-full col-span-3"
              />

              {schoolSelect !== null && schoolSelect.id === "other" && (
                <>
                  <div className="col-span-1" />
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800 text-sm col-span-3">
                    لقد اخترت <strong>مدرسة أخرى</strong>. فضلاً اكتب اسم
                    المدرسة بشكل واضح أدناه.
                  </div>
                  <div className="col-span-1" />
                  <Input
                    id="schoolNameOther"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="اسم المدرسة"
                    className="bg-white border-gray-300 rounded-lg col-span-3"
                    required
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="studentGrade" className="text-right">
                الصف الدراسي
              </Label>
              <Input
                id="studentGrade"
                value={studentGrade}
                onChange={(e) => setStudentGrade(e.target.value)}
                className="col-span-3 bg-white border-gray-300 rounded-lg"
                placeholder="مثال: الصف التاسع"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">
                رقم الجوال
              </Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="col-span-3 bg-white border-gray-300 rounded-lg"
                placeholder="مثال: 0555321542"
                required
              />
            </div>

            {errorMsg && (
              <div className="col-span-full">
                <p className="text-red-600 text-sm text-center">{errorMsg}</p>
              </div>
            )}

            <Button
              type="submit"
              onClick={handleManualSubmit}
              disabled={!isValid || loading}
              className="w-full"
            >
              {loading ? "جاري الحفظ..." : "بدء المهمة"}
            </Button>

            <button
              onClick={() => setStep("email")}
              className="w-full text-sm text-gray-600 hover:text-gray-700"
              disabled={loading}
            >
              ← العودة لإدخال البريد الإلكتروني
            </button>
          </div>
        )}
      </DialogContent>
    </CustomDialog>
  );
}
