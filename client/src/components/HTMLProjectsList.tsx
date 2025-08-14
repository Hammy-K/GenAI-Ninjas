import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { ProjectWithStudent } from "@/types/html-projects-types";
import ProjectCard from "./ProjectCard";
import LoadingSpinner from "./LoadingSpinner";
import { useOrganization } from "@/hooks/useOrganization";
import { FolderOpen } from "lucide-react";

interface Props {
  search: string;
}

export default function HtmlProjectsList({ search }: Props) {
  const [projects, setProjects] = useState<ProjectWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const organization = useOrganization();
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 30,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/html-projects/submissions?page=${queryParams.page}&limit=${queryParams.limit}&search=${encodeURIComponent(debouncedSearch)}&sortBy=${queryParams.sortBy}&sortOrder=${queryParams.sortOrder}&organization=${encodeURIComponent(organization.name)}`,
        );

        if (!res.ok) throw new Error("فشل في تحميل المشاريع");

        const response = await res.json();
        setProjects(response.data);
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err.message || "حدث خطأ ما");
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [
    queryParams.page,
    queryParams.limit,
    debouncedSearch,
    queryParams.sortBy,
    queryParams.sortOrder,
  ]);

  return (
    <div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-center text-red-500 bg-[#f5f2e8]">خطأ: {error}</p>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="mb-4">
            <FolderOpen className="w-16 h-16 text-gray-300" strokeWidth={1} />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-1">
            لا توجد مشاريع
          </p>
          <p className="text-gray-400 text-sm text-center max-w-sm">
            هنا ستعرض مشاريع الطلاب
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <div className="flex justify-between gap-4 mt-6 w-full">
            <Button
              disabled={queryParams.page === 1}
              onClick={() =>
                setQueryParams((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              السابق
            </Button>
            <span className="self-center">
              الصفحة {pagination.page} من {pagination.totalPages} (
              {pagination.total} مشروع)
            </span>
            <Button
              disabled={queryParams.page === pagination.totalPages}
              onClick={() =>
                setQueryParams((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
