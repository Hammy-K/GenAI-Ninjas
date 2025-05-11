import React from "react";
import LovableMissionStage from "@/components/stages/LovableMissionStage";
import { Header } from "@/components/layout/Header";
import { useQuest } from "@/hooks/useQuest";

export default function LovableMission() {
  const { xp } = useQuest();
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-tajawal" dir="rtl">
      <Header xp={xp} />
      
      <main className="flex-1 py-4">
        <LovableMissionStage />
      </main>
    </div>
  );
}