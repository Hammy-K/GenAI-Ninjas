import { useLocation } from "wouter";
import { Button } from "../ui/button";
import { Gamepad2 } from "lucide-react";

export default function HTMLProjectsPageHeader() {
  const [location, setLocation] = useLocation();

  const goToHtmlGenerator = () => {
    setLocation("/missions/ai-html-generator");
  };
  return (
    <div className="flex flex-rows w-full justify-between">
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <div className="text-right">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-800 to-indigo-700 bg-clip-text text-transparent">
              مشاريع الطلاب
            </h1>
            <p className="text-lg text-gray-700 leading-relaxed">
              جميع المشاريع المعروضة في هذا التطبيق تم إنشاؤها بواسطة الطلاب
              باستخدام الذكاء الاصطناعي
            </p>
          </div>
        </div>
      </div>

      <div className="">
        <Button
          variant="default"
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
          onClick={goToHtmlGenerator}
        >
          <Gamepad2 className="h-5 w-5" />
          <span>العودة الى تصميم الالعاب</span>
        </Button>
      </div>
    </div>
  );
}
