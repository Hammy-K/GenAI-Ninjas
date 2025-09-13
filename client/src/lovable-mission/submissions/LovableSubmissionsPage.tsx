import { useState } from "react";
import { useLocation } from "wouter";
import LovableProjectsPageHeader from "./LovableProjectsPageHeader";
import LovableViewSwitch from "./LovableViewSwitch";
import LovableSubmissionsList from "./LovableSubmissionsList";

export default function LovableSubmissionsPage() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"featured" | "all">("featured");

  return (
    <div
      className="px-48 mx-auto bg-[#f5f2e8] text-foreground font-tajawal h-screen"
      dir="rtl"
    >
      <LovableProjectsPageHeader
        title="📂 مشاريع Lovable"
        subtitle="استعرض المشاريع المنشورة"
        onGoHome={() => navigate("/missions/lovable")}
      />

      <div className="flex justify-center w-full my-2">
        <div className="w-fit">
          <LovableViewSwitch view={view} onChange={setView} />
          {/* optional search box could go here */}
        </div>
      </div>

      <LovableSubmissionsList view={view} />
    </div>
  );
}
