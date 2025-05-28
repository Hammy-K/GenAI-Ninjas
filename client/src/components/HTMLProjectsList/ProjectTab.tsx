import { Star, Grid } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  activeTab: "featured" | "all";
  onTabChange: (tab: "featured" | "all") => void;
}

export default function ProjectTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-2 shadow-lg border border-purple-200 backdrop-blur-sm">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "featured" ? "default" : "ghost"}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === "featured"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md transform scale-105"
                : "text-purple-700 hover:bg-purple-100 hover:text-purple-800"
            }`}
            onClick={() => onTabChange("featured")}
          >
            <Star
              className={`h-5 w-5 ${activeTab === "featured" ? "fill-current" : ""}`}
            />
            المشاريع المميزة
          </Button>
          <Button
            variant={activeTab === "all" ? "default" : "ghost"}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === "all"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md transform scale-105"
                : "text-purple-700 hover:bg-purple-100 hover:text-purple-800"
            }`}
            onClick={() => onTabChange("all")}
          >
            <Grid className="h-5 w-5" />
            جميع المشاريع
          </Button>
        </div>
      </div>
    </div>
  );
}
