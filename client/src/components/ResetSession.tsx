import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
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

      // remove studentId cookie saved for the html generator
      Cookies.remove("studentId");

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/missions/html-generator");
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
          🚀 المهمة جاهزة... باقي تبدأها بس!
        </h1>
        <p className="mb-6 text-center">ابدأ مهمة اليوم وورّينا ابداعك</p>
        <div className="flex flex-col  gap-4">
          <Button
            onClick={resetAllLocalStorage}
            variant="positive"
            className="w-full text-xl"
            disabled={isResetting}
          >
            {isResetting ? "🔥 جهز نفسك ..." : "يلا نبدأ! 🔥"}
          </Button>
        </div>
      </div>
    </div>
  );
}
