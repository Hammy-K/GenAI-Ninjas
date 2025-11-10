import React from "react";
import {
  CustomDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthModal } from "./useAuthModal";
import { SchoolSelect } from "@/components/common/SelectSchool";
import { ArrowRight } from "lucide-react";

export default function StudentMainAuthModal() {
  const { toast } = useToast();

  const {
    // state
    open,
    step,
    email,
    setEmail,
    emailLoading,
    fullName,
    setFullName,
    schoolName,
    setSchoolName,
    schoolSelect,
    setSchoolSelect,
    studentGrade,
    setStudentGrade,
    phoneNumber,
    setPhoneNumber,
    loading,
    errorMsg,
    isValidManual,
    manualErrors,
    setManualErrors,

    // validators
    isValidEmail,

    // actions
    setStep,
    handleEmailLookup,
    handleManualSubmit,
  } = useAuthModal();

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
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className={`bg-white border-gray-300 rounded-lg ${
                  email && !isValidEmail(email) ? "border-red-500" : ""
                }`}
                disabled={emailLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEmailLookup(toast);
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
              onClick={() => handleEmailLookup(toast)}
              disabled={!isValidEmail(email) || emailLoading}
              className="w-full"
            >
              {emailLoading ? "جاري التحقق..." : "متابعة"}
            </Button>

            <Button
              onClick={() => setStep("manual")}
              className="w-full text-sm"
              disabled={emailLoading}
              variant="ghost"
            >
              ليس لدي بريد إلكتروني أو أفضل الإدخال اليدوي
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                الاسم الكامل
              </Label>

              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (manualErrors.fullName)
                    setManualErrors((p) => ({ ...p, fullName: undefined }));
                }}
                className="col-span-3 bg-white border-gray-300 rounded-lg"
                placeholder="...."
                required
              />
            </div>

            {manualErrors.fullName && (
              <p className="text-red-600 text-xs">{manualErrors.fullName}</p>
            )}

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

                  if (manualErrors.email)
                    setManualErrors((p) => ({ ...p, email: undefined }));
                }}
                className={`col-span-3 bg-white border-gray-300 rounded-lg ${
                  email && !isValidEmail(email) ? "border-red-500" : ""
                }`}
                placeholder="example@gmail.com (اختياري)"
              />
            </div>
            {manualErrors.email && (
              <p className="text-red-600 text-xs">{manualErrors.email}</p>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schoolName" className="text-right">
                اسم المدرسة
              </Label>

              <SchoolSelect
                onChange={(value) => {
                  setSchoolSelect(value);

                  if (manualErrors.schoolSelect)
                    setManualErrors((p) => ({ ...p, schoolSelect: undefined }));

                  if (value?.id !== "other") {
                    setSchoolName(value?.label ?? "");

                    if (manualErrors.schoolName) {
                      setManualErrors((p) => ({ ...p, schoolName: undefined }));
                    }
                  }
                }}
                value={schoolSelect}
                showLabel={false}
                className="w-full col-span-3"
              />

              {manualErrors.schoolSelect && (
                <p className="text-red-600 text-xs">
                  {manualErrors.schoolSelect}
                </p>
              )}

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
                    onChange={(e) => {
                      setSchoolName(e.target.value);
                      if (manualErrors.schoolName)
                        setManualErrors((p) => ({
                          ...p,
                          schoolName: undefined,
                        }));
                    }}
                    placeholder="اسم المدرسة"
                    className="bg-white border-gray-300 rounded-lg col-span-3"
                    required
                  />
                </>
              )}

              {manualErrors.schoolName && (
                <p className="text-red-600 text-xs">
                  {manualErrors.schoolName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="studentGrade" className="text-right">
                الصف الدراسي
              </Label>
              <Input
                id="studentGrade"
                value={studentGrade}
                onChange={(e) => {
                  setStudentGrade(e.target.value);
                  if (manualErrors.studentGrade)
                    setManualErrors((p) => ({ ...p, studentGrade: undefined }));
                }}
                className="col-span-3 bg-white border-gray-300 rounded-lg"
                placeholder="مثال: الصف التاسع"
                required
              />

              {manualErrors.studentGrade && (
                <p className="text-red-600 text-xs">
                  {manualErrors.studentGrade}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">
                رقم الجوال
              </Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (manualErrors.phoneNumber)
                    setManualErrors((p) => ({ ...p, phoneNumber: undefined }));
                }}
                className="col-span-3 bg-white border-gray-300 rounded-lg"
                placeholder="مثال: 0555321542"
                required
              />

              {manualErrors.phoneNumber && (
                <p className="text-red-600 text-xs">
                  {manualErrors.phoneNumber}
                </p>
              )}
            </div>

            {errorMsg && (
              <div className="col-span-full">
                <p className="text-red-600 text-sm text-center">{errorMsg}</p>
              </div>
            )}

            <Button
              type="submit"
              onClick={() => handleManualSubmit(toast)}
              disabled={loading}
              className="w-full"
            >
              {loading ? "جاري الحفظ..." : "بدء المهمة"}
            </Button>

            <Button
              onClick={() => setStep("email")}
              className="w-full text-sm"
              disabled={loading}
              variant="ghost"
            >
              <ArrowRight className="w-4 h-4" /> العودة لإدخال البريد الإلكتروني
            </Button>
          </div>
        )}
      </DialogContent>
    </CustomDialog>
  );
}
