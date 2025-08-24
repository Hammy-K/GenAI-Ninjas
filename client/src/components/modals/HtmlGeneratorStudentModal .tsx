import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
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

export default function HtmlGeneratorStudentModal() {
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    const studentId = Cookies.get("studentId");
    if (!studentId) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    setIsValid(
      fullName.trim() !== "" &&
        schoolName.trim() !== "" &&
        studentGrade.trim() !== "" &&
        /^05\d{8}$/.test(phoneNumber.trim()),
    );
  }, [fullName, schoolName, phoneNumber]);

  const handleSubmit = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          schoolName,
          phoneNumber,
        }),
      });

      if (!res.ok) {
        throw new Error("حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى.");
      }

      const data = await res.json();

      if (!data.id) {
        throw new Error("لم يتم العثور على معرف الطالب.");
      }

      Cookies.set("studentId", data.id, { expires: 3 });

      localStorage.setItem("studentName", fullName);
      localStorage.setItem("studentGrade", studentGrade);
      localStorage.setItem("schoolName", schoolName);
      localStorage.setItem("phoneNumber", phoneNumber);

      toast({
        title: "🎉 أهلاً بك!",
        description: `يا ${fullName} من ${schoolName}، تم تسجيلك بنجاح في النظام.`,
      });

      setOpen(false);
    } catch (error: any) {
      setErrorMsg(error.message || "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomDialog open={open}>
      <DialogContent className="bg-white" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            👋 أهلاً بك في منشئ الألعاب!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            قبل ما نبدأ، نحتاج بعض المعلومات البسيطة
          </DialogDescription>
        </DialogHeader>

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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="schoolName" className="text-right">
              اسم المدرسة
            </Label>
            <Input
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="col-span-3 bg-white border-gray-300 rounded-lg"
              placeholder="...."
              required
            />
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
        </div>

        <DialogFooter className="flex justify-end">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isValid || loading}
          >
            {loading ? "جاري الحفظ..." : "بدء المهمة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </CustomDialog>
  );
}
