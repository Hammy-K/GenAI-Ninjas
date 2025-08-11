import { useEffect, useState } from "react";
import { ProjectWithStudent } from "@/types/html-projects-types";
import LoadingSpinner from "../LoadingSpinner";
import ProjectCard from "../ProjectCard";
import { useOrganization } from "@/hooks/useOrganization";

const FEATURED_PROJECT_IDS = [
  "project_1748334063133_oyv2wi",
  "project_1748332318892_nv0je7",
  "project_1748332220714_t1n5qy",
  "project_1748331425609_7411zr",
  "project_1748244688921_ztonp5",
  "project_1748244470312_y9gk2o",
  "project_1748244331496_f2kmg8",
  "project_1748244675764_vtos70",
  "project_1748159947022_4d3da3",
  "project_1748158533000_mqts0r",
  "project_1748160476214_zcp8f3",
  "project_1748158651744_6yy1nx",
  "project_1748158532698_uih297",
];


const FFM_FEATURED_PROJECT_IDS = [];

export default function FeaturedProjectsList() {
  const [projects, setProjects] = useState<ProjectWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const organization = useOrganization();

  console.log("------------------");
  console.log(organization);
  console.log("------------------");

  useEffect(() => {
    async function fetchFeaturedProjects() {
      try {
        setLoading(true);

        const res = await fetch("/api/html-projects/featured", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectIds: FEATURED_PROJECT_IDS }),
        });

        if (!res.ok) throw new Error("فشل في تحميل المشاريع المميزة");

        const response = await res.json();

        setProjects(response.data);
      } catch (err: any) {
        setError(err.message || "حدث خطأ ما");
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProjects();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) return <p className="text-center text-red-500">خطأ: {error}</p>;

  if (projects.length === 0)
    return (
      <p className="text-center text-gray-500 p-8">لا توجد مشاريع مميزة</p>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
