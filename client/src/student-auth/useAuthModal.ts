import { useEffect, useMemo, useState } from "react";
import { AuthStep, SchoolSelectValue } from "./auth.types";
import { ls, storageKeys } from "./storage.utils";
import { getStudentIdCookie, setStudentIdCookie } from "./cookies.utils";
import { isValidEmail, isValidSaudiMobile, nonEmpty } from "./validation.utils";
import { fetchTrackStudentByEmail, upsertStudent } from "./auth.api";
import { clearAuthSession } from "./session.utils";

type UseAuthModalParams = {
  onAuthed?: (studentId: string | number) => void;
};

export type ManualFormErrors = {
  fullName?: string;
  schoolSelect?: string;
  schoolName?: string;
  studentGrade?: string;
  phoneNumber?: string;
  email?: string;
};

export function useAuthModal({ onAuthed }: UseAuthModalParams = {}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<AuthStep>("email");
  const [manualErrors, setManualErrors] = useState<ManualFormErrors>({});

  // email step
  const [email, setEmailState] = useState(() => ls.get(storageKeys.email));
  const [emailLoading, setEmailLoading] = useState(false);

  // manual step
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [studentGrade, setStudentGrade] = useState<string>(
    () => ls.get(storageKeys.studentGrade) || "",
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [schoolSelect, setSchoolSelect] = useState<SchoolSelectValue>(null);

  // general
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const setEmail = (value: string) => {
    setEmailState(value);

    if (value.trim()) {
      ls.set(storageKeys.email, value.trim());
    }
  };

  useEffect(() => {
    const studentId = getStudentIdCookie();

    if (!studentId) setOpen(true);
  }, []);

  useEffect(() => {
    if (schoolName === "مدرسة أخرى") setSchoolName("");
  }, [schoolName]);

  const isValidManual = useMemo(() => {
    const pickedOther = schoolSelect !== null && schoolSelect.id === "other";

    const schoolOk = pickedOther
      ? nonEmpty(schoolName)
      : nonEmpty(schoolSelect?.label || "");

    return (
      nonEmpty(fullName) &&
      schoolOk &&
      nonEmpty(studentGrade) &&
      isValidSaudiMobile(phoneNumber)
    );
  }, [fullName, schoolName, studentGrade, phoneNumber, schoolSelect]);

  const handleEmailLookup = async (
    toast: (args: {
      title: string;
      description?: string;
      variant?: "destructive";
    }) => void,
  ) => {
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
      const trackStudent = await fetchTrackStudentByEmail(email);

      if (!trackStudent) {
        toast({
          title: "البريد غير موجود",
          description: "لم نجد بريدك في النظام. يرجى ملء البيانات يدوياً.",
        });

        setStep("manual");

        return;
      }

      const student = await upsertStudent({
        email,
        fullName: trackStudent.studentName || email.split("@")[0],
        schoolName: trackStudent.school || "غير محدد",
        phoneNumber: trackStudent.phoneNumber || "",
      });

      setStudentIdCookie(student.id);

      ls.set(storageKeys.studentName, trackStudent.studentName || email);
      ls.set(storageKeys.schoolName, trackStudent.school || "");
      ls.set(storageKeys.email, email);

      toast({
        title: "🎉 أهلاً بك!",
        description: `مرحباً ${trackStudent.studentName || "بك"}! تم تسجيل دخولك بنجاح.`,
      });

      setOpen(false);
      onAuthed?.(student.id);
    } catch (e: any) {
      console.error("Email lookup error:", e);
      setErrorMsg(e?.message || "حدث خطأ. حاول مرة أخرى.");
    } finally {
      setEmailLoading(false);
    }
  };

  function buildManualErrors(): ManualFormErrors {
    const errs: ManualFormErrors = {};
    const pickedOther = schoolSelect !== null && schoolSelect.id === "other";
    const schoolOk = pickedOther
      ? nonEmpty(schoolName)
      : nonEmpty(schoolSelect?.label || "");

    if (!nonEmpty(fullName)) errs.fullName = "رجاءً أدخل الاسم كاملًا.";

    if (!schoolOk) {
      errs[pickedOther ? "schoolName" : "schoolSelect"] = pickedOther
        ? "اكتب اسم المدرسة بوضوح."
        : "اختر المدرسة.";
    }

    if (!nonEmpty(studentGrade)) errs.studentGrade = "رجاءً أدخل الصف الدراسي.";

    if (!isValidSaudiMobile(phoneNumber))
      errs.phoneNumber = "رجاءً أدخل رقم جوال سعودي صحيح.";

    // email is optional — add only if you want format checks when present:
    if (email?.trim() && !isValidEmail(email.trim().toLowerCase()))
      errs.email = "رجاءً أدخل بريدًا صحيحًا.";

    return errs;
  }

  const handleManualSubmit = async (
    toast: (args: { title: string; description?: string }) => void,
  ) => {
    if (!isValidManual || loading) {
      setManualErrors(buildManualErrors());
      return;
    }

    setManualErrors({});
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        fullName,
        schoolName:
          schoolSelect?.id === "other"
            ? schoolName
            : schoolSelect?.label || schoolName,
        phoneNumber,
        email: email || undefined,
      };

      const student = await upsertStudent(payload);

      if (!student?.id) throw new Error("لم يتم العثور على معرف الطالب.");

      setStudentIdCookie(student.id);

      ls.set(storageKeys.studentName, fullName);
      ls.set(storageKeys.studentGrade, studentGrade);
      ls.set(storageKeys.schoolName, payload.schoolName);
      ls.set(storageKeys.phoneNumber, phoneNumber);
      if (email) ls.set(storageKeys.email, email);

      toast({
        title: "🎉 أهلاً بك!",
        description: `يا ${fullName} من ${payload.schoolName}، تم تسجيلك بنجاح في النظام.`,
      });

      setOpen(false);
      onAuthed?.(student.id);
    } catch (e: any) {
      setErrorMsg(e?.message || "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthSession();
  };

  return {
    // state
    open,
    setOpen,
    step,
    setStep,
    manualErrors,
    setManualErrors,

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

    // validators
    isValidEmail,
    isValidSaudiMobile,

    // actions
    handleEmailLookup,
    handleManualSubmit,
    logout,
  };
}
