import { useState } from "react";
import { useLocation } from "wouter";
import LovableProjectsPageHeader from "./LovableProjectsPageHeader";
import LovableViewSwitch from "./LovableViewSwitch";
import LovableSubmissionsList from "./LovableSubmissionsList";
import SearchInput from "@/components/HTMLProjectsList/SearchInput";

export default function LovableSubmissionsPage() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"featured" | "all">("featured");
  const [search, setSearch] = useState("");

  return (
    <div className="bg-[#f5f2e8]" dir="rtl">
      <div className="px-6 pb-6 max-w-7xl mx-auto min-h-screen text-foreground font-tajawal">
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

      {view === "all" && (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="ابحث باسم الطالب ، رمز نون أو عنوان المشروع"
        />
      )}

      <LovableSubmissionsList view={view} search={search} />
      </div>
    </div>
  );
}
