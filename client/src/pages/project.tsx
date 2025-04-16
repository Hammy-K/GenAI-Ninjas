import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { loadProject } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Project() {
  const [location] = useLocation();
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Load project from Firebase or localStorage
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

  // If we have HTML content, display it fullscreen without any UI
  if (html) {
    return (
      <iframe
        title="Project Preview"
        className="w-full h-screen border-0"
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin"
      />
    );
  }

  // Show loading or error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium mb-1">Loading project...</p>
            <p className="text-sm text-muted-foreground">Please wait while we retrieve the project.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
            <p className="text-sm text-muted-foreground mb-6">The project could not be loaded.</p>
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}