import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Copy } from "lucide-react";

interface Video {
  title: string;
  embedCode: string;
}

interface Session {
  id: number;
  code: string;
  title: string;
  createdAt: string;
}

export default function VideoLibraryAdmin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [title, setTitle] = useState("");
  const [videos, setVideos] = useState<Video[]>([{ title: "", embedCode: "" }]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/video-library/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/video-library/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        const data = await response.json();
        setSessions(data.sessions);
        toast({ title: "Authenticated successfully" });
      } else {
        toast({ title: "Invalid password", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Authentication failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addVideo = () => {
    setVideos([...videos, { title: "", embedCode: "" }]);
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const updateVideo = (
    index: number,
    field: "title" | "embedCode",
    value: string,
  ) => {
    const newVideos = [...videos];
    newVideos[index][field] = value;
    setVideos(newVideos);
  };

  const createSession = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a session title", variant: "destructive" });
      return;
    }

    const validVideos = videos.filter(
      (v) => v.title.trim() && v.embedCode.trim(),
    );
    if (validVideos.length === 0) {
      toast({ title: "Please add at least one video", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/video-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, title, videos: validVideos }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: `Session created! Code: ${data.code}` });
        setTitle("");
        setVideos([{ title: "", embedCode: "" }]);
        fetchSessions();
      } else {
        const error = await response.json();
        toast({
          title: error.error || "Failed to create session",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Failed to create session", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (code: string) => {
    if (!confirm(`Delete session ${code}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/video-library/${code}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        toast({ title: "Session deleted" });
        fetchSessions();
      } else {
        toast({ title: "Failed to delete session", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to delete session", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/video-library/${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard!" });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Video Library Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Video Library Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Week 5 Lecture Videos"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Videos</Label>
                <Button onClick={addVideo} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </div>

              {videos.map((video, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Video {index + 1}</Label>
                      {videos.length > 1 && (
                        <Button
                          onClick={() => removeVideo(index)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Video title"
                      value={video.title}
                      onChange={(e) =>
                        updateVideo(index, "title", e.target.value)
                      }
                    />
                    <Textarea
                      placeholder="Paste full iframe embed code here"
                      value={video.embedCode}
                      onChange={(e) =>
                        updateVideo(index, "embedCode", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </Card>
              ))}
            </div>

            <Button
              onClick={createSession}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Session"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-gray-500">No sessions created yet</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{session.title}</p>
                      <p className="text-sm text-gray-600">
                        Code: {session.code}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => copyLink(session.code)}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteSession(session.code)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
