import { useState } from "react";
import { Button } from "../ui/button";
import FeaturedProjectsList from "./FeaturedProjectsList";
import ProjectTabs from "./ProjectTab";
import HTMLProjectsPageHeader from "./HTMLProjectsPageHeader";
import SearchInput from "./SearchInput";
import HtmlProjectsList from "../HTMLProjectsList";

export default function HtmlProjectsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"featured" | "all">("featured");

  return (
    <div className="bg-[#f5f2e8]">
      <div className="px-6 pb-6 font-sans max-w-7xl mx-auto min-h-screen">
        <HTMLProjectsPageHeader />

        <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "all" && (
          <SearchInput value={search} onChange={setSearch} />
        )}

        {activeTab === "featured" ? (
          <FeaturedProjectsList />
        ) : (
          <HtmlProjectsList search={search} />
        )}
      </div>
    </div>
  );
}
