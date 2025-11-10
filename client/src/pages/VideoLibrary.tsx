import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Video {
  title: string;
  embedCode: string;
}

interface Session {
  code: string;
  title: string;
  videos: Video[];
  createdAt: string;
}

export default function VideoLibrary() {
  const { code } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSession();
  }, [code]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/video-library/${code}`);

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        setError("Session not found");
      }
    } catch (error) {
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{session?.title}</CardTitle>
          </CardHeader>
        </Card>

        {session?.videos.map((video, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{video.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="video-container"
                dangerouslySetInnerHTML={{ __html: video.embedCode }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
