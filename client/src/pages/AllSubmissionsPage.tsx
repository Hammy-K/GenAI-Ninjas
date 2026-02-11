import { useState } from "react";
import { Code, Smartphone } from "lucide-react";
import FeaturedProjectsList from "@/components/HTMLProjectsList/FeaturedProjectsList";
import HtmlProjectsList from "@/components/HTMLProjectsList";
import LovableSubmissionsList from "@/lovable-mission/submissions/LovableSubmissionsList";
import SearchInput from "@/components/HTMLProjectsList/SearchInput";

type ProjectType = "html" | "lovable";
type SubView = "featured" | "all";

export default function AllSubmissionsPage() {
  const [projectType, setProjectType] = useState<ProjectType>("html");
  const [subView, setSubView] = useState<SubView>("featured");
  const [search, setSearch] = useState("");

  const handleProjectTypeChange = (type: ProjectType) => {
    setProjectType(type);
    setSubView("featured");
    setSearch("");
  };

  return (
    <div className="bg-[#f5f2e8] min-h-screen" dir="rtl">
      <div className="px-4 sm:px-6 pb-6 max-w-7xl mx-auto font-tajawal">
        <div className="pt-6 pb-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-800">
            معرض مشاريع الطلاب
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            استعرض المشاريع المنشورة من طلابنا المبدعين
          </p>
        </div>

        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-1.5 shadow-lg border border-purple-200 w-full max-w-md">
            <div className="flex gap-1.5">
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-300 font-semibold text-sm sm:text-base ${
                  projectType === "html"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                    : "text-purple-700 hover:bg-purple-100"
                }`}
                onClick={() => handleProjectTypeChange("html")}
              >
                <Code className="h-4 w-4 sm:h-5 sm:w-5" />
                مشاريع HTML
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-300 font-semibold text-sm sm:text-base ${
                  projectType === "lovable"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                    : "text-purple-700 hover:bg-purple-100"
                }`}
                onClick={() => handleProjectTypeChange("lovable")}
              >
                <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
                مشاريع Lovable
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-1 shadow border border-purple-200">
            <div className="flex gap-1">
              <button
                className={`px-4 py-1.5 rounded-lg transition-all text-sm font-semibold ${
                  subView === "featured"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow"
                    : "text-purple-700 hover:bg-purple-100"
                }`}
                onClick={() => { setSubView("featured"); setSearch(""); }}
              >
                المميزة
              </button>
              <button
                className={`px-4 py-1.5 rounded-lg transition-all text-sm font-semibold ${
                  subView === "all"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow"
                    : "text-purple-700 hover:bg-purple-100"
                }`}
                onClick={() => setSubView("all")}
              >
                الكل
              </button>
            </div>
          </div>
        </div>

        {subView === "all" && (
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              projectType === "html"
                ? "ابحث باسم الطالب أو عنوان المشروع"
                : "ابحث باسم الطالب ، رمز نون أو عنوان المشروع"
            }
          />
        )}

        {projectType === "html" ? (
          subView === "featured" ? (
            <FeaturedProjectsList />
          ) : (
            <HtmlProjectsList search={search} />
          )
        ) : (
          <LovableSubmissionsList view={subView} search={search} />
        )}
      </div>
    </div>
  );
}
