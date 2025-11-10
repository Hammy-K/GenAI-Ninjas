import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Copy, CheckCircle } from "lucide-react";

interface TextItem {
  title: string;
  content: string;
}

interface Session {
  code: string;
  title: string;
  texts: TextItem[];
  createdAt: string;
}

export default function TextLibraryAdmin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [texts, setTexts] = useState<TextItem[]>([{ title: "", content: "" }]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated]);

  const login = async () => {
    const response = await fetch("/api/text-library/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      setIsAuthenticated(true);
      fetchSessions();
    } else {
      alert("Invalid password");
    }
  };

  const fetchSessions = async () => {
    const response = await fetch("/api/text-library/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      const data = await response.json();
      setSessions(data.sessions);
    }
  };

  const addText = () => {
    setTexts([...texts, { title: "", content: "" }]);
  };

  const removeText = (index: number) => {
    setTexts(texts.filter((_, i) => i !== index));
  };

  const updateText = (
    index: number,
    field: "title" | "content",
    value: string,
  ) => {
    const newTexts = [...texts];
    newTexts[index][field] = value;
    setTexts(newTexts);
  };

  const createSession = async () => {
    if (
      !sessionTitle.trim() ||
      texts.some((t) => !t.title.trim() || !t.content.trim())
    ) {
      alert("Please fill in all fields");
      return;
    }

    const response = await fetch("/api/text-library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, title: sessionTitle, texts }),
    });

    if (response.ok) {
      const data = await response.json();
      setGeneratedCode(data.code);
      setSessionTitle("");
      setTexts([{ title: "", content: "" }]);
      fetchSessions();
    } else {
      alert("Failed to create session");
    }
  };

  const deleteSession = async (code: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    const response = await fetch(`/api/text-library/${code}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      fetchSessions();
    } else {
      alert("Failed to delete session");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Text Library Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && login()}
              />
            </div>
            <Button onClick={login} className="w-full">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Text Library Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="session-title">Session Title</Label>
              <Input
                id="session-title"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g., Study Notes - Chapter 5"
              />
            </div>

            {texts.map((text, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Text Item {index + 1}</Label>
                    {texts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeText(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Text title"
                    value={text.title}
                    onChange={(e) => updateText(index, "title", e.target.value)}
                  />
                  <Textarea
                    placeholder="Text content"
                    value={text.content}
                    onChange={(e) =>
                      updateText(index, "content", e.target.value)
                    }
                    rows={6}
                  />
                </div>
              </Card>
            ))}

            <Button onClick={addText} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add Another Text
            </Button>

            <Button onClick={createSession} className="w-full">
              Create Session
            </Button>

            {generatedCode && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 mb-2">
                  Session created! Share this code:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-2xl font-bold text-green-900">
                    {generatedCode}
                  </code>
                  <Button
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/text-library/${generatedCode}`,
                      )
                    }
                  >
                    {copiedCode ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  URL: {window.location.origin}/text-library/{generatedCode}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.code}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{session.title}</p>
                    <p className="text-sm text-gray-600">
                      Code: {session.code} • {session.texts.length} text(s)
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSession(session.code)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No sessions yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
