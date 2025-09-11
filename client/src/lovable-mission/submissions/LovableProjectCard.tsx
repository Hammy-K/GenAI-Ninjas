type LovableSubmission = {
  id: number;
  studentName: string;
  noonCode?: string;
  projectTitle: string;
  projectLink: string;
  createdAt: string;
};

type Props = { project: LovableSubmission };

export default function LovableProjectCard({ project }: Props) {
  return (
    <div
      className="relative bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1"
      role="article"
    >
      <div className="p-4">
        <h3 className="font-semibold text-lg text-purple-700 text-center">
          {project.projectTitle}
        </h3>

        <div className="mt-2 text-sm text-center">
          <p className="text-gray-700">
            👤 {project.studentName || "طالب غير معروف"}
            {project.noonCode ? ` • كود: ${project.noonCode}` : ""}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            🗓️ {new Date(project.createdAt).toLocaleString("ar-SA")}
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <a
            href={project.projectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 text-sm"
          >
            فتح المشروع
          </a>
        </div>
      </div>
    </div>
  );
}
