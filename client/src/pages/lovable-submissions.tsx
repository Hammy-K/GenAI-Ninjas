import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, ExternalLinkIcon, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// Define the shape of a submission from API
interface LovableSubmission {
  id: number;
  studentName: string;
  projectName?: string; // May not exist in older submissions
  projectLink: string;
  projectType: string;
  submissionDate: string;
}

export default function LovableSubmissionsPage() {
  const [submissions, setSubmissions] = useState<LovableSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<LovableSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
        setFilteredSubmissions(data);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load submissions. Please try again later.');
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
    const filtered = submissions.filter(submission => 
      submission.studentName.toLowerCase().includes(query)
    );
    
    setFilteredSubmissions(filtered);
  }, [searchQuery, submissions]);

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: ar // Use Arabic locale
    });
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl" dir="rtl">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">مشاريع الطلاب</h1>
        <p className="text-gray-600 mb-4">جميع المشاريع المقدمة في رحلة الدكتور بنجي</p>
        
        {/* Search input */}
        <div className="relative max-w-md mx-auto mb-4">
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="البحث باسم الطالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8 bg-white" 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-pulse flex flex-col w-full max-w-3xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg mb-4"></div>
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
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>
            {searchQuery ? 'لا توجد نتائج تطابق البحث' : 'لا توجد مشاريع مقدمة حتى الآن'}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[70vh]">
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-2 pt-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-base font-medium">{submission.studentName || "طالب"}</CardTitle>
                      <CardDescription className="flex items-center mt-1 text-sm">
                        <span className="font-medium">{submission.projectName || "مشروع"}</span>
                        <span className="mx-2">•</span>
                        <CalendarIcon className="h-3 w-3 inline ml-1" />
                        <span>{formatDate(submission.submissionDate)}</span>
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8">
                      <a 
                        href={submission.projectLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        فتح المشروع <ExternalLinkIcon className="h-3 w-3 mr-1" />
                      </a>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}