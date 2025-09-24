import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import VideoSubmissionCard from "./VideoSubmissionCard";
import { FolderOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type VideoSubmission = {
  id: number;
  projectName: string;
  link: string;
  submittedAt: string;
  studentName: string;
  grade: string;
  school: string;
};

async function fetchVideoSubmissions(): Promise<VideoSubmission[]> {
  const response = await fetch('/api/video-submissions/gallery');
  if (!response.ok) {
    throw new Error('Failed to fetch video submissions');
  }
  return response.json();
}

export default function VideoSubmissionsList() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ['video-submissions'],
    queryFn: fetchVideoSubmissions
  });

  // Filter submissions based on search term
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return submissions;
    
    return submissions.filter(submission =>
      submission.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [submissions, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-2">جار التحميل...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">حدث خطأ في تحميل المشاريع</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">لا توجد مشاريع فيديو متاحة حاليا</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Search Bar */}
      <div className="flex justify-center w-full">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث باسم الطالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right"
            data-testid="search-input"
          />
        </div>
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="text-center text-sm text-muted-foreground">
          عرض {filteredSubmissions.length} من أصل {submissions.length} مشروع
        </div>
      )}

      {/* No results message */}
      {searchTerm && filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">لا توجد نتائج للبحث "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((submission) => (
            <VideoSubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}