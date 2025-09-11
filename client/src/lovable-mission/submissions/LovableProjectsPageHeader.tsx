import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import LovableHeaderLogos from "./LovableHeaderLogos";

type Props = {
  title: string;
  subtitle?: string;
  onGoHome: () => void;
};

export default function LovableProjectsPageHeader({
  title,
  subtitle,
  onGoHome,
}: Props) {
  return (
    <div className="w-full mb-4" dir="rtl">
      <LovableHeaderLogos />

      <div className="flex items-center justify-between mt-2">
        <div className="text-right">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-800 to-indigo-700 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div>
          <Button
            variant="default"
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
            onClick={onGoHome}
          >
            <Home className="h-5 w-5" />
            الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
