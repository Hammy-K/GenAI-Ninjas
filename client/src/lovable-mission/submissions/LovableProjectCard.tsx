import { useEffect, useRef, useState } from "react";
import { ExternalLink, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const timerRef = useRef<number | null>(null);

  const url = project.projectLink;

  useEffect(() => {
    // safety timeout: stop loading after 3s
    setLoading(true);
    setFailed(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [url]);

  const openProject = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onKeyActivate: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openProject();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openProject}
      onKeyDown={onKeyActivate}
      className="relative bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      aria-label={`فتح مشروع: ${project.projectTitle}`}
    >
      {/* Preview area */}
      <div className="w-full aspect-video bg-gray-50 border-b border-gray-100 relative">
        {!failed ? (
          <>
            {loading && <PreviewSkeleton />}
            <iframe
              src={url}
              title={`Preview of ${project.projectTitle}`}
              className="absolute inset-0 w-full h-full border-0 pointer-events-none"
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 gap-2">
            <ImageOff className="w-5 h-5" />
            <span className="text-sm">لا تتوفر معاينة</span>
          </div>
        )}
      </div>

      {/* Meta */}
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

        {/* <div className="mt-3 flex justify-center text-xs text-gray-500">
          <Button>فتح المشروع</Button>
        </div> */}
      </div>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="absolute inset-0 animate-pulse">
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
    </div>
  );
}
