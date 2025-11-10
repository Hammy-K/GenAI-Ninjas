import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, BookOpen, FileText } from "lucide-react";

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

export default function TextLibrary() {
  const { code } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchSession();
  }, [code]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/text-library/${code}`);

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        setError("الجلسة غير موجودة");
      }
    } catch (error) {
      setError("فشل تحميل الجلسة");
    } finally {
      setLoading(false);
    }
  };

  // Robust copy function that works in iframes
  const copyToClipboard = (text: string, index: number) => {
    // Create a temporary textarea element
    const textarea = document.createElement("textarea");

    // Set the text content
    textarea.value = text;

    // Style it to be invisible and off-screen
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    textarea.setAttribute("readonly", "");

    // Add to DOM
    document.body.appendChild(textarea);

    // Handle iOS devices
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textarea.setSelectionRange(0, 999999);
    } else {
      // Select the text
      textarea.select();
      textarea.setSelectionRange(0, 999999); // For mobile devices
    }

    // Copy the text
    try {
      document.execCommand("copy");
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }

    // Remove the textarea
    document.body.removeChild(textarea);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-700 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4"
        dir="rtl"
      >
        <Card className="w-full max-w-md shadow-xl border-red-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-xl text-red-600 font-semibold">{error}</p>
              <p className="text-sm text-gray-500">
                يرجى التحقق من الرمز والمحاولة مرة أخرى
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4"
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white overflow-hidden">
          <CardHeader className="pb-8 pt-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-right mb-2">
                  {session?.title}
                </CardTitle>
                <p className="text-blue-100 text-sm text-right">
                  {session?.texts.length} نص متاح للنسخ
                </p>
              </div>
            </div>
          </CardHeader>
          <div className="h-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"></div>
        </Card>

        {/* Text Items */}
        <div className="space-y-5">
          {session?.texts.map((text, index) => (
            <Card
              key={index}
              className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group"
            >
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                      {index + 1}
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-800 text-right">
                      {text.title}
                    </CardTitle>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => copyToClipboard(text.content, index)}
                    className={`mr-4 transition-all duration-300 ${
                      copiedIndex === index
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    } text-white shadow-md hover:shadow-lg`}
                  >
                    {copiedIndex === index ? (
                      <>
                        <CheckCircle className="h-5 w-5 ml-2" />
                        <span className="font-semibold">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5 ml-2" />
                        <span className="font-semibold">نسخ النص</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border-2 border-blue-100 shadow-inner">
                  <pre
                    className="whitespace-pre-wrap text-base leading-relaxed text-gray-800 text-right"
                    style={{
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                  >
                    {text.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            رمز الجلسة:{" "}
            <span className="font-mono font-bold text-blue-600">
              {session?.code}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
