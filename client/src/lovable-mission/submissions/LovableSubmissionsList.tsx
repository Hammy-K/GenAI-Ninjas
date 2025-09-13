import { useEffect, useMemo, useState } from "react";
import LovableProjectCard from "./LovableProjectCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FolderOpen } from "lucide-react";
import { fetchSubmissions } from "../api/lovable.api";
import { toastError } from "../ui/Toast";
import { Button } from "@/components/ui/button";

type LovableSubmission = {
  id: number;
  studentName: string;
  noonCode?: string;
  projectTitle: string;
  projectLink: string;
  createdAt: string;
};

type Props = {
  view: "featured" | "all";
  search?: string;
};

export default function LovableSubmissionsList({ view, search = "" }: Props) {
  const [rows, setRows] = useState<LovableSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 30;

  const offset = useMemo(() => (page - 1) * limit, [page, limit]);

  useEffect(() => {
    setPage(1);
  }, [view, search]);

  useEffect(() => {
    let aborted = false;

    (async () => {
      setLoading(true);
      try {
        const json = await fetchSubmissions({
          search: search || undefined,
          limit,
          offset,
          orderBy: "createdAt",
          orderDirection: "desc",
          featured: view === "featured",
        });

        if (!aborted) setRows(json?.rows ?? []);
      } catch {
        if (!aborted) toastError("تعذر تحميل المشاريع");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [view, search, limit, offset]);

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rows.map((p) => (
          <LovableProjectCard key={p.id} project={p} />
        ))}
      </div>

      <div className="flex justify-between gap-4 mt-6 w-full">
        <Button
          disabled={page === 1}
          onClick={() => setPage((x) => Math.max(1, x - 1))}
        >
          السابق
        </Button>

        {/* <span className="self-center">
          الصفحة {pagination.page} من {pagination.totalPages} (
          {pagination.total} مشروع)
        </span> */}
        <span className="text-sm text-gray-600">صفحة {page}</span>

        <Button
          disabled={rows.length < limit}
          onClick={() => setPage((x) => x + 1)}
        >
          التالي
        </Button>
      </div>

      {/* <div className="flex justify-between items-center">
        <button
          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          disabled={page === 1}
          onClick={() => setPage((x) => Math.max(1, x - 1))}
        >
          السابق
        </button>

        <span className="text-sm text-gray-600">صفحة {page}</span>

        <button
          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          disabled={rows.length < limit}
          onClick={() => setPage((x) => x + 1)}
        >
          التالي
        </button>
      </div> */}
    </div>
  );
}
