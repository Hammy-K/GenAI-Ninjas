import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: "#f5f2e8" }}
      dir="rtl"
    >
      <div className="text-center space-y-8 max-w-lg mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-gray-800">noon</span>
          </div>
        </div>

        {/* 404 Number */}
        <div className="space-y-4">
          <h1 className="text-8xl font-bold text-gray-800 tracking-tight">
            404
          </h1>
          <div className="w-24 h-1 bg-yellow-400 mx-auto rounded-full"></div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">
            عذراً! الصفحة غير موجودة
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            يبدو أن الصفحة التي تبحث عنها غير متوفرة. دعنا نساعدك في العودة إلى
            المسار الصحيح.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            className="flex items-center justify-center gap-2 font-medium px-6 py-3 rounded-xl transition-colors duration-200 shadow-sm"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            <Home className="w-5 h-5" />
            الصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
