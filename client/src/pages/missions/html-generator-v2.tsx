import React, { useState, useEffect } from "react";
import { HTMLGeneratorV2 } from "../../components/stages/HTMLGeneratorV2Fixed";
import StudentInfoModal from "@/components/modals/StudentInfoModal";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Database, Users } from "lucide-react";

export default function HTMLGeneratorV2Page() {
  // Check if student info is already in localStorage
  const hasStudentInfo = Boolean(
    localStorage.getItem("lovable_student_name") && 
    localStorage.getItem("lovable_noon_code")
  );

  // For navigation
  const [location, setLocation] = useLocation();

  // Track if student info is completed
  const [isStudentInfoCompleted, setIsStudentInfoCompleted] = useState(hasStudentInfo);

  // Handler for student info modal completion
  const handleStudentInfoComplete = () => {
    setIsStudentInfoCompleted(true);
  };

  // Handle navigation to submissions
  const goToSubmissions = () => {
    setLocation("/missions/html-generator-v2/submissions");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f2e8] text-foreground font-tajawal" dir="rtl">
      {/* Navigation header */}
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">منشئ HTML بالذكاء الاصطناعي</h1>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={goToSubmissions}
          >
            <Database className="h-4 w-4" />
            <span>عرض جميع المشاريع</span>
          </Button>
        </div>
      </header>
      
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