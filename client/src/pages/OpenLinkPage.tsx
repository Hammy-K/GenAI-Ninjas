import { ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OpenLinkPage() {
  const missionLink =
    "https://ai.noon.edu.sa/project/PROJEC_5D3VPOR-J0h99MKf4NPBug/MISSIO_-015RKuv3oV8CueCBLtPUV";

  const handleOpenLink = () => {
    window.open(missionLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
        {/* Decorative header bar */}
        <div className="h-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"></div>

        <CardContent className="pt-12 pb-12 px-8">
          <div className="text-center space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-800">
                جاهز تصمم لعبتك؟!
              </h1>
              <p className="text-gray-600 text-lg">
                افتح الرابط في متصفح التابلت لبدء المهمة
              </p>
            </div>

            {/* Open Link Button */}
            <Button
              onClick={handleOpenLink}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl font-bold py-7 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <ExternalLink className="h-6 w-6 ml-3" />
              افتح الرابط
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
