import { FrontendProject } from "@/services/application-development/frontend.service";
import { Share2 } from "lucide-react";

type Props = {
  project: FrontendProject;
  onShare?: (projectId: string) => void;
};

export default function ProjectCard({ project, onShare }: Props) {
  return (
    <div
      className="relative bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 h-64"
      onClick={() =>
        window.open(
          `/missions/app-development/frontend-foundation/projects/${project.projectId}`,
          "_blank",
        )
      }
      role="button"
    >
      <iframe
        srcDoc={project.html}
        title={`Preview of ${project.projectId}`}
        sandbox="allow-scripts"
        className="w-full h-2/3 border-0"
        style={{ pointerEvents: "none" }}
      />
      <div className="p-3 bg-[#fafafa] text-sm">
        <p className="font-semibold text-lg text-center">
          👤 {project.student?.fullName || "طالب غير معروف"}
        </p>
        <p className="text-gray-600 text-center">
          🏫 {project.student?.schoolName || "مدرسة غير معروفة"}
        </p>
        <p className="text-gray-500 text-xs text-center">
          🗓️{" "}
          {new Date(project.createdAt).toLocaleTimeString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          })}
        </p>
      </div>

      {onShare && (
        <button
          className="absolute top-2 left-2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
          onClick={(e) => {
            e.stopPropagation();
            onShare(project.projectId);
          }}
          aria-label="مشاركة المشروع"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
