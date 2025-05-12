import React from "react";
import LovableMissionStage from "@/components/stages/LovableMissionStage";

export default function LovableMission() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-tajawal" dir="rtl">
      <main className="flex-1">
        <LovableMissionStage />
      </main>
    </div>
  );
}