import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, ExternalLinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// Define the shape of a submission from API
interface LovableSubmission {
  id: number;
  studentName: string;
  projectLink: string;
  projectType: string;
  submissionDate: string;
}

export default function LovableSubmissionsPage() {
  const [submissions, setSubmissions] = useState<LovableSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/lovable-mission/submissions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }
        
        const data = await response.json();
        setSubmissions(data);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load submissions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: ar // Use Arabic locale
    });
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl" dir="rtl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">مشاريع الطلاب</h1>
        <p className="text-gray-600 mb-6">جميع المشاريع المقدمة في رحلة الدكتور بنجي</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-pulse flex flex-col w-full max-w-3xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            إعادة المحاولة
          </Button>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>لا توجد مشاريع مقدمة حتى الآن</p>
        </div>
      ) : (
        <ScrollArea className="h-[70vh]">
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{submission.studentName || "طالب"}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{formatDate(submission.submissionDate)}</span>
                      </CardDescription>
                    </div>
                    <Badge variant={submission.projectType === 'app' ? 'default' : 'secondary'}>
                      {submission.projectType === 'app' ? 'تطبيق' : 'لعبة'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 truncate max-w-sm">
                      {submission.projectLink}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={submission.projectLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        فتح المشروع <ExternalLinkIcon className="h-4 w-4 mr-1" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}