import { useEffect, useMemo, useState } from "react";
import LovableProjectCard from "./LovableProjectCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FolderOpen } from "lucide-react";
import { fetchSubmissions } from "../api/lovable.api";
import { toastError } from "../ui/Toast";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";

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

type ApiResponse = {
  rows: LovableSubmission[];
  count: number;
  limit: number;
  offset: number;
};

export default function LovableSubmissionsList({ view, search = "" }: Props) {
  const [rows, setRows] = useState<LovableSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // pagination state (client)
  const [page, setPage] = useState(1);
  const clientLimit = 30;

  // server meta (echoed back from API)
  const [serverCount, setServerCount] = useState(0);
  const [serverLimit, setServerLimit] = useState(clientLimit);
  const [serverOffset, setServerOffset] = useState(0);

  const offset = useMemo(() => (page - 1) * clientLimit, [page]);

  // derive helpers from the 4 fields we have: count, limit, offset, rows
  const total = serverCount;
  const perPage = serverLimit || clientLimit;
  const currentPage = Math.floor(serverOffset / (perPage || 1)) + 1;
  const totalPages = Math.max(1, Math.ceil((total || 0) / (perPage || 1)));
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [view, debouncedSearch]);

  useEffect(() => {
    let aborted = false;

    (async () => {
      setLoading(true);
      try {
        const json = (await fetchSubmissions({
          search: debouncedSearch || undefined,
          limit: clientLimit,
          offset,
          orderBy: "createdAt",
          orderDirection: "desc",
          featured: view === "featured",
        })) as ApiResponse;

        if (!aborted) {
          setRows(json?.rows ?? []);
          setServerCount(json?.count ?? 0);
          setServerLimit(json?.limit ?? clientLimit);
          setServerOffset(json?.offset ?? offset);
        }
      } catch {
        if (!aborted) toastError("تعذر تحميل المشاريع");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [view, debouncedSearch, clientLimit, offset]);

  if (loading) return <LoadingSpinner />;

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 h-screen">
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
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rows.map((p) => (
          <LovableProjectCard key={p.id} project={p} />
        ))}
      </div>

      <div className="flex justify-between items-center gap-4 mt-6 w-full">
        <Button
          disabled={!canPrev}
          onClick={() => setPage((x) => Math.max(1, x - 1))}
        >
          السابق
        </Button>

        <span className="self-center text-sm text-gray-600">
          الصفحة {currentPage} من {totalPages} ({total} مشروع)
        </span>

        <Button disabled={!canNext} onClick={() => setPage((x) => x + 1)}>
          التالي
        </Button>
      </div>
    </div>
  );
}
