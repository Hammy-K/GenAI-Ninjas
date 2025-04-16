import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { loadProject } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, Home, Eye, Code } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Project() {
  const [location] = useLocation();
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  useEffect(() => {
    async function fetchProject() {
      try {
        setIsLoading(true);
        setError(null);

        // Extract project ID from URL
        const projectId = location.split('/').pop();
        
        if (!projectId) {
          setError('Invalid project URL');
          setIsLoading(false);
          return;
        }

        // Load project from Firebase
        const project = await loadProject(projectId);
        
        if (project && project.html) {
          setHtml(project.html);
        } else {
          setError('Project not found');
        }
      } catch (err) {
        setError('Failed to load project');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-medium text-xl">AI Web Builder</h1>
            <span className="text-sm text-muted-foreground">Shared Project</span>
          </div>
          
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow">
        {/* Toolbar */}
        <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
          <span className="font-medium text-sm">
            {viewMode === 'preview' ? 'Live Preview' : 'HTML Code'}
          </span>
          
          {!isLoading && !error && (
            <div className="flex border rounded overflow-hidden">
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                className="rounded-none px-3 py-1 h-8 text-xs"
                onClick={() => setViewMode('preview')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'code' ? 'default' : 'outline'}
                className="rounded-none px-3 py-1 h-8 text-xs"
                onClick={() => setViewMode('code')}
              >
                <Code className="h-3 w-3 mr-1" />
                Code
              </Button>
            </div>
          )}
        </div>
        
        {/* Content Area */}
        <div className="flex-grow bg-white h-[calc(100vh-116px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Loading project...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-red-500 mb-2">{error}</p>
              <p>The project could not be loaded.</p>
              <Link href="/">
                <Button variant="outline" className="mt-4">
                  Back to Home
                </Button>
              </Link>
            </div>
          ) : viewMode === 'preview' ? (
            <iframe
              title="Project Preview"
              className="w-full h-full border-0"
              srcDoc={html || ''}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <ScrollArea className="h-full w-full">
              <pre className="p-4 text-xs text-gray-800 whitespace-pre-wrap">
                {html}
              </pre>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
}