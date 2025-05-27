import { ProjectWithStudent } from "../types/html-projects-types";

type Props = {
  project: ProjectWithStudent;
};

export default function ProjectCard({ project }: Props) {
  return (
    <div
      className="relative bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 cursor-pointer h-64"
      onClick={() =>
        window.open(
          `https://noongenai.replit.app/project/${project.projectId}`,
          "_blank",
        )
      }
    >
      <iframe
        srcDoc={project.html}
        title={`Preview of ${project.projectId}`}
        sandbox="allow-scripts"
        className="w-full h-2/3 border-0"
        style={{ pointerEvents: "none" }}
      />
      <div className="p-3 bg-[#fafafa] border-t text-sm z-20">
        <p className="font-semibold text-lg text-center">
          👤 {project.student?.fullName || "طالب غير معروف"}
        </p>
        <p className="text-gray-600 text-center">
          🏫 {project.student?.schoolName || "مدرسة غير معروفة"}
        </p>
        <p className="text-gray-500 text-xs text-center">
          🗓️ تاريخ المشروع:{" "}
          {new Date(project.createdAt).toLocaleDateString("ar-EG")}
        </p>
      </div>
    </div>
  );
}
