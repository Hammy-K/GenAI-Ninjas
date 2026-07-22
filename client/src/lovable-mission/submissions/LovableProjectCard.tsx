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
      className="relative bg-background rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      aria-label={`فتح مشروع: ${project.projectTitle}`}
    >
      {/* Preview area */}
      <div className="w-full aspect-video bg-card border-b border-gray-100 relative">
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
          <p className="text-foreground">
            👤 {project.studentName || "طالب غير معروف"}
            {project.noonCode ? ` • كود: ${project.noonCode}` : ""}
          </p>
          <p className="text-muted text-xs mt-1">
            🗓️{" "}
            {new Intl.DateTimeFormat("ar-SA", {
              calendar: "gregory",
              numberingSystem: "arab",
              timeZone: "Asia/Riyadh",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }).format(new Date(project.createdAt))}
          </p>
        </div>

        {/* <div className="mt-3 flex justify-center text-xs text-muted">
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
