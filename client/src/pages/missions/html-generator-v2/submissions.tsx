import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Search, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface HtmlSubmission {
  id: number;
  projectId: string;
  studentName?: string; // From localStorage
  studentId?: string; // From localStorage
  firebaseUid?: string;
  createdAt: string;
  updatedAt: string;
}

export default function HtmlGeneratorV2SubmissionsPage() {
  const [submissions, setSubmissions] = useState<HtmlSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<HtmlSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Get student info from localStorage for each submission
  const enrichSubmissions = (subs: any[]): HtmlSubmission[] => {
    return subs.map(sub => {
      // Try to get student info from localStorage (this will be the current user's info only)
      const studentName = localStorage.getItem("lovable_student_name") || "طالب";
      const studentId = localStorage.getItem("lovable_noon_code") || "";
      
      return {
        ...sub,
        studentName,
        studentId,
        projectLink: `/project/${sub.projectId}`
      };
    });
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/html-projects/submissions");

        if (!response.ok) {
          throw new Error("Failed to fetch submissions");
        }

        const data = await response.json();
        const enrichedData = enrichSubmissions(data);
        setSubmissions(enrichedData);
        setFilteredSubmissions(enrichedData);
      } catch (err) {
        console.error("Error fetching submissions:", err);
        setError("Failed to load submissions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  // Filter submissions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubmissions(submissions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = submissions.filter(
      (sub) =>
        (sub.studentName && sub.studentName.toLowerCase().includes(query)) ||
        (sub.studentId && sub.studentId.toLowerCase().includes(query)) ||
        (sub.projectId && sub.projectId.toLowerCase().includes(query))
    );

    setFilteredSubmissions(filtered);
  }, [searchQuery, submissions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Back to HTML Generator page
  const goBack = () => {
    setLocation("/missions/html-generator-v2");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f2e8] text-foreground font-tajawal" dir="rtl">
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">مشاريع HTML</h1>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={goBack}
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة لإنشاء مشروع جديد</span>
          </Button>
        </div>
      </header>
      
      <div className="container py-8">
        {/* Content section */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            عرض جميع مشاريع HTML التي تم إنشاؤها بواسطة الطلاب
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث حسب اسم الطالب أو رقم التعريف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="mr-2">جاري تحميل المشاريع...</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-12 text-destructive">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              إعادة المحاولة
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredSubmissions.length === 0 && (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">
              {searchQuery
                ? "لا توجد نتائج مطابقة لبحثك. حاول استخدام كلمات أخرى."
                : "لا توجد مشاريع بعد. سيظهر هنا المشاريع التي تم إنشاؤها بواسطة الطلاب."}
            </p>
          </div>
        )}

        {/* Results grid */}
        {!isLoading && !error && filteredSubmissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="overflow-hidden bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">
                    {submission.studentName || "طالب"} 
                    {submission.studentId && (
                      <span className="text-sm text-muted-foreground mr-2 font-normal">
                        ({submission.studentId})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="truncate max-w-full" title={submission.projectId}>
                      مشروع HTML: {submission.projectId.substring(0, 8)}...
                    </p>
                    <p className="mt-1">{formatDate(submission.createdAt)}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex flex-col gap-2">
                    <a
                      href={`/project/${submission.projectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        عرض المشروع <ExternalLink className="h-4 w-4 mr-2" />
                      </Button>
                    </a>
                    <div className="text-xs text-muted-foreground overflow-hidden text-ellipsis">
                      <span className="font-medium">الرابط:</span> 
                      <span className="rtl:text-left rtl:dir-ltr overflow-hidden text-ellipsis" dir="ltr">{window.location.origin}/project/{submission.projectId}</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}