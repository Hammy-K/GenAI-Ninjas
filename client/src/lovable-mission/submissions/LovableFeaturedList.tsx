import { useEffect, useState } from "react";
import LovableProjectCard from "./LovableProjectCard";
import { FolderOpen } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchSubmissions } from "../api/lovable.api";
import { toastError } from "../ui/Toast";

type LovableSubmission = {
  id: number;
  studentName: string;
  noonCode?: string;
  projectTitle: string;
  projectLink: string;
  createdAt: string;
};

export default function LovableFeaturedList() {
  const [rows, setRows] = useState<LovableSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // If you later add a "featured" flag, pass it via querystring.
        const json = await fetchSubmissions({
          limit: 60,
          orderBy: "createdAt",
          orderDirection: "desc",
        });

        setRows(json?.rows ?? []);
      } catch {
        toastError("تعذر تحميل المشاريع");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="mb-4">
          <FolderOpen className="w-16 h-16 text-gray-300" strokeWidth={1} />
        </div>
        <p className="text-gray-500 text-lg font-medium mb-1">لا توجد مشاريع</p>
        <p className="text-gray-400 text-sm text-center max-w-sm">
          سيتم عرض المشاريع المنشورة هنا
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rows.map((p) => (
        <LovableProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}
