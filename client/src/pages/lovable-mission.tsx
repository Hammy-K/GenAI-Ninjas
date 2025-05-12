import React from "react";
import LovableMissionStage from "@/components/stages/LovableMissionStage";
import { Header } from "@/components/layout/Header";
import { useQuest } from "@/hooks/useQuest";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ListIcon } from "lucide-react";

export default function LovableMission() {
  const { xp } = useQuest();
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-tajawal" dir="rtl">
      <Header xp={xp} />
      
      <div className="container mx-auto px-4 py-2 flex justify-end">
        <Button variant="outline" size="sm" asChild className="flex items-center gap-1">
          <Link href="/missions/lovable/submissions">
            <ListIcon className="h-4 w-4" />
            <span>عرض جميع المشاريع</span>
          </Link>
        </Button>
      </div>
      
      <main className="flex-1 py-4">
        <LovableMissionStage />
      </main>
    </div>
  );
}