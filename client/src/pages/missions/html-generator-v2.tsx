import React from "react";
import { HTMLGeneratorV2 } from "../../components/stages/HTMLGeneratorV2Fixed";

export default function HTMLGeneratorV2Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-tajawal" dir="rtl">
      <main className="flex-1">
        <HTMLGeneratorV2
          onComplete={() => {}}
          onEarnXp={() => {}}
          onUnlockBadge={() => {}}
          onBack={() => {}}
        />
      </main>
    </div>
  );
}