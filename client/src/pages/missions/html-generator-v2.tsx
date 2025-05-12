import React from "react";
import { HTMLStandalone } from "../../components/stages/HTMLStandalone";

export default function HTMLGeneratorV2() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-tajawal" dir="rtl">
      <main className="flex-1">
        <HTMLStandalone
          onComplete={() => {}}
          onEarnXp={() => {}}
          onUnlockBadge={() => {}}
          onBack={() => {}}
        />
      </main>
    </div>
  );
}