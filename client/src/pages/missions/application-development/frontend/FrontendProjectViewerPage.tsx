import { useParams } from "wouter";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useFindFrontendProjectByProjectId } from "@/hooks/useFindFrontendProjectByProjectId";

export default function FrontendProjectViewerPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useFindFrontendProjectByProjectId(projectId, !!projectId);

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-gray-500 text-sm">جارٍ تحميل المشروع…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    console.error(error);

    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-500 font-semibold text-lg mb-2">
            حدث خطأ أثناء تحميل المشروع
          </p>
          <p className="text-gray-600 text-sm">
            {(error as Error)?.message || "حاول مرة أخرى لاحقاً"}
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#f5f2e8]">
        <div className="text-center">
          <p className="text-gray-500 font-semibold text-lg mb-2">
            المشروع غير موجود
          </p>
          <p className="text-gray-400 text-sm">
            تأكد من الرابط أو اسأل المشرف عن توفر المشروع.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen">
      <iframe
        title={`Project ${project.projectId}`}
        srcDoc={project.html}
        className="w-screen h-screen border-0"
        sandbox="allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}
