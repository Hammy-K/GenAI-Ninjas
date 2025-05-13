import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StudentInfoModalProps {
  onComplete: () => void;
}

export default function StudentInfoModal({
  onComplete,
}: StudentInfoModalProps) {
  const [studentName, setStudentName] = useState("");
  const [noonCode, setNoonCode] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [open, setOpen] = useState(true);

  // Check if both fields are filled
  useEffect(() => {
    setIsValid(studentName.trim() !== "" && noonCode.trim() !== "");
  }, [studentName, noonCode]);

  const handleSubmit = () => {
    if (!isValid) return;

    // Save to localStorage
    localStorage.setItem("lovable_student_name", studentName.trim());
    localStorage.setItem("lovable_noon_code", noonCode.trim());

    // Close modal and notify parent
    setOpen(false);
    onComplete();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        // Prevent closing with escape key or clicking outside
        if (!open && !isValid) return;
        setOpen(open);
      }}
    >
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            معلومات الطالب
          </DialogTitle>
          <DialogDescription>
            الرجاء إدخال المعلومات التالية قبل البدء في المهمة
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="studentName" className="text-right">
              اسم الطالب
            </Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="col-span-3 bg-white"
              placeholder="...."
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="noonCode" className="text-right">
              رمز نون المميز
            </Label>
            <Input
              id="noonCode"
              value={noonCode}
              onChange={(e) => setNoonCode(e.target.value)}
              className="col-span-3 bg-white"
              placeholder="...."
              required
            />
          </div>
        </div>
        <DialogFooter className="flex justify-end">
          <Button type="submit" onClick={handleSubmit} disabled={!isValid}>
            بدء المهمة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
