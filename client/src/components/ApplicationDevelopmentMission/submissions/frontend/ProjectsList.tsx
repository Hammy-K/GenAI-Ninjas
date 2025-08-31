import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FolderOpen } from "lucide-react";
import { FrontendSubMission } from "./FrontendProjectsTab";
import { useFrontendProjects } from "@/hooks/useFrontendProjects";
import ProjectCard from "./FrontendProjectCard";

type Props = {
  organization: string;
  mission: FrontendSubMission;
  search?: string;
};

export default function ProjectsList({
  organization,
  mission,
  search = "",
}: Props) {
  const [page, setPage] = useState(1);
  const limit = 30;
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, mission, organization]);

  const { data, isLoading, isError, error, isFetching } = useFrontendProjects({
    organization: organization,
    mission: mission,
    page: page,
    limit: limit,
    search: debouncedSearch,
    sortBy: "createdAt",
    sortOrder: "desc",
    featured: false,
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

  const pagination = data?.pagination;

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="mb-4">
          <FolderOpen className="w-16 h-16 text-gray-300" strokeWidth={1} />
        </div>
        <p className="text-gray-500 text-lg font-medium mb-1">لا توجد مشاريع</p>
        <p className="text-gray-400 text-sm text-center max-w-sm">
          سيتم عرض مشاريع الطلاب هنا
        </p>
      </div>
    );
  }

  return (
    <div>
      {isFetching && (
        <div className="text-center text-gray-400 mb-2">جارٍ التحديث…</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      {pagination && (
        <div className="flex justify-between gap-4 mt-6 w-full">
          <Button
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            السابق
          </Button>
          <span className="self-center">
            الصفحة {pagination.page} من {pagination.totalPages} (
            {pagination.total} مشروع)
          </span>
          <Button
            disabled={page === pagination.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
