import { useLocation } from "wouter";
import { Database } from "lucide-react";
import SearchInput from "./SearchInput";
import { useState } from "react";
import { Button } from "../ui/button";
import HtmlProjectsList from "../HTMLProjectsList";

export default function HtmlProjectsPage() {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const goToHtmlGenerator = () => {
    setLocation("/missions/ai-html-generator");
  };

  return (
    <div className="bg-[#f5f2e8]">
      <div className="p-6 font-sans max-w-7xl mx-auto min-h-screen">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">مشاريع الطلاب</h1>
          <p className="text-gray-600 mb-4">
            جميع المشاريع المعروضة في هذا التطبيق تم إنشاؤها بواسطة الطلاب
            باستخدام الذكاء الاصطناعي
          </p>

          <Button
            variant="default"
            className="flex items-center gap-2 mx-auto"
            onClick={goToHtmlGenerator}
          >
            <Database className="h-4 w-4" />
            <span>العودة الى تصميم الالعاب</span>
          </Button>
        </div>

        <SearchInput value={search} onChange={setSearch} />

        <HtmlProjectsList search={search} />
      </div>
    </div>
  );
}
