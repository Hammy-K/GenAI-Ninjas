import React, { useState, useEffect } from "react";
import { HTMLGeneratorV2 } from "../../components/stages/HTMLGeneratorV2Fixed";
import StudentInfoModal from "@/components/modals/StudentInfoModal";

export default function HTMLGeneratorV2Page() {
  // Check if student info is already in localStorage
  const hasStudentInfo = Boolean(
    localStorage.getItem("lovable_student_name") && 
    localStorage.getItem("lovable_noon_code")
  );

  // Track if student info is completed
  const [isStudentInfoCompleted, setIsStudentInfoCompleted] = useState(hasStudentInfo);

  // Handler for student info modal completion
  const handleStudentInfoComplete = () => {
    setIsStudentInfoCompleted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f2e8] text-foreground font-tajawal" dir="rtl">
      <main className="flex-1">
        {!isStudentInfoCompleted && (
          <StudentInfoModal onComplete={handleStudentInfoComplete} />
        )}
        <HTMLGeneratorV2
          onComplete={() => {}}
          onEarnXp={() => {}}
          onUnlockBadge={() => {}}
          onBack={() => {}}
        />
      </main>
    </div>
  );
}