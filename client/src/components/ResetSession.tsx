import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export function ResetSession() {
  const [, navigate] = useLocation();
  const [isResetting, setIsResetting] = useState(false);

  const resetAllLocalStorage = () => {
    setIsResetting(true);
    try {
      // Clear all localStorage
      window.localStorage.clear();
      console.log("Session reset complete - all local storage cleared");

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/");
        window.location.reload(); // Force a full reload
      }, 500);
    } catch (error) {
      console.error("Error resetting session:", error);
      setIsResetting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-4"
      dir="rtl"
    >
      <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          مسح بيانات الجلسة
        </h1>
        <p className="mb-6 text-center">
          سيؤدي هذا إلى مسح جميع التقدم الخاص بك والعودة إلى حالة البداية. هل
          أنت متأكد؟
        </p>
        <div className="flex flex-col gap-4">
          <Button
            onClick={resetAllLocalStorage}
            variant="destructive"
            className="w-full"
            disabled={isResetting}
          >
            {isResetting ? "جاري المسح..." : "نعم، امسح جلستي وابدأ من جديد"}
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full"
            disabled={isResetting}
          >
            إلغاء والعودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
