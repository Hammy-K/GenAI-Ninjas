import { useState } from "react";
import { useLocation } from "wouter";
import { useOrganization } from "@/hooks/useOrganization";
import ProjectTabs, {
  FrontendSubMission,
} from "@/components/ApplicationDevelopmentMission/submissions/frontend/FrontendProjectsTab";
import ViewSwitch from "@/components/ApplicationDevelopmentMission/submissions/frontend/FrontendViewSwitch";
import SearchInput from "@/components/HTMLProjectsList/SearchInput";
import FeaturedProjectsList from "@/components/ApplicationDevelopmentMission/submissions/frontend/FrontendFeaturedList";
import ProjectsList from "@/components/ApplicationDevelopmentMission/submissions/frontend/ProjectsList";
import AppDevProjectsPageHeader from "@/components/ApplicationDevelopmentMission/submissions/common/AppDevProjectsPageHeader";

export default function FrontendSubmissionsPage() {
  const organization = useOrganization();
  const [_loc, setLocation] = useLocation();

  const [activeMissionTab, setActiveMissionTab] =
    useState<FrontendSubMission>("inputs-outputs");
  const [view, setView] = useState<"featured" | "all">("featured");
  const [search, setSearch] = useState("");

  return (
    <div className="bg-[#f5f2e8] min-h-screen">
      <div className="px-6 pb-6 font-sans max-w-7xl mx-auto">
        <AppDevProjectsPageHeader
          title="رحلة تطوير التطبيقات - مشاريع أساسيات الواجهات الأمامية"
          subtitle="استعرض مشاريع الطلاب الخاصة بمسارات أساسيات الواجهات الأمامية"
          onGoHome={() => setLocation("/")}
        />

        <div className="flex flex-col items-center justify-between gap-1 mb-4">
          <ProjectTabs
            activeTab={activeMissionTab}
            onTabChange={setActiveMissionTab}
          />

          <ViewSwitch view={view} onChange={setView} />
        </div>

        {view === "all" && (
          <div className="mb-6">
            <SearchInput value={search} onChange={setSearch} />
          </div>
        )}

        {view === "featured" ? (
          <FeaturedProjectsList
            organization={organization.name}
            mission={activeMissionTab}
          />
        ) : (
          <ProjectsList
            organization={organization.name}
            mission={activeMissionTab}
            search={search}
          />
        )}
      </div>
    </div>
  );
}
