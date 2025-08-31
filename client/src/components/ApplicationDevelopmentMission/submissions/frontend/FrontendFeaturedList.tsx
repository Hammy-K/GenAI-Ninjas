import LoadingSpinner from "@/components/LoadingSpinner";
import { FolderOpen } from "lucide-react";
import { FrontendSubMission } from "./FrontendProjectsTab";
import { useFrontendProjects } from "@/hooks/useFrontendProjects";

type Props = {
  organization: string;
  mission: FrontendSubMission;
};

export default function FeaturedProjectsList({ organization, mission }: Props) {
  const { data, isLoading, isError, error } = useFrontendProjects({
    organization,
    mission,
    featured: true,
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    console.error(error);

    return (
      <p className="text-center text-red-500">
        خطأ: {(error as Error).message}
      </p>
    );
  }

  const projects = data?.data ?? [];
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="mb-4">
          <FolderOpen className="w-16 h-16 text-gray-300" strokeWidth={1} />
        </div>
        <p className="text-gray-500 text-lg font-medium mb-1">
          لا توجد مشاريع مميزة
        </p>
        <p className="text-gray-400 text-sm text-center max-w-sm">
          هنا ستعرض المشاريع المميزة لمسار الواجهة الأمامية
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}
