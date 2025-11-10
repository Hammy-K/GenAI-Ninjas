import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Eye,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
} from "lucide-react";

interface Session {
  id: number;
  code: string;
  title: string;
  correctAnswer: string;
  status: string;
  createdAt: string;
  voteCount: number;
}

interface Statistics {
  session: {
    id: number;
    code: string;
    title: string;
    correctAnswer: string;
    status: string;
  };
  statistics: {
    totalVotes: number;
    votesA: number;
    votesB: number;
    percentageA: string;
    percentageB: string;
    correctVotes: number;
    percentageCorrect: string;
    maleVotes: number;
    femaleVotes: number;
    percentageMale: string;
    percentageFemale: string;
    teacherBreakdown: {
      [key: string]: {
        total: number;
        correct: number;
        answerA: number;
        answerB: number;
      };
    };
  };
}

export default function AIPollControl() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStats, setSelectedStats] = useState<Statistics | null>(null);

  // Create form state
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionVideo, setNewSessionVideo] = useState("");
  const [newSessionAnswer, setNewSessionAnswer] = useState<"A" | "B">("A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authenticate = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/ai-poll/sessions?password=${encodeURIComponent(password)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setSessions(data.sessions);
      } else {
        setError(data.error || "كلمة المرور غير صحيحة");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال");
    }
    setLoading(false);
  };

  const loadSessions = async () => {
    try {
      const response = await fetch(
        `/api/ai-poll/sessions?password=${encodeURIComponent(password)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Error loading sessions:", err);
    }
  };

  const createSession = async () => {
    if (!newSessionTitle || !newSessionVideo) {
      setError("جميع الحقول مطلوبة");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/ai-poll/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          title: newSessionTitle,
          videoEmbed: newSessionVideo,
          correctAnswer: newSessionAnswer,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("تم إنشاء الجلسة بنجاح!");
        setNewSessionTitle("");
        setNewSessionVideo("");
        setNewSessionAnswer("A");
        setShowCreateForm(false);
        loadSessions();
      } else {
        setError(data.error || "حدث خطأ");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال");
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`تم نسخ ${type}!`);
    setTimeout(() => setSuccess(""), 2000);
  };

  const loadStatistics = async (sessionId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai-poll/session/${sessionId}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (response.ok) {
        setSelectedStats(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("حدث خطأ في تحميل الإحصائيات");
    }
    setLoading(false);
  };

  const closeSession = async (sessionId: number) => {
    if (!confirm("هل أنت متأكد من إغلاق هذه الجلسة؟")) return;

    try {
      const response = await fetch(`/api/ai-poll/session/${sessionId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("تم إغلاق الجلسة");
        loadSessions();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("حدث خطأ");
    }
  };

  const deleteSession = async (sessionId: number) => {
    if (
      !confirm(
        "هل أنت متأكد من حذف هذه الجلسة؟ سيتم حذف جميع البيانات المرتبطة بها.",
      )
    )
      return;

    try {
      const response = await fetch(`/api/ai-poll/session/${sessionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("تم حذف الجلسة");
        loadSessions();
        if (selectedStats?.session.id === sessionId) {
          setSelectedStats(null);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("حدث خطأ");
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4"
        dir="rtl"
      >
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              لوحة التحكم - استطلاع الذكاء الاصطناعي
            </h1>
            <p className="text-gray-600">الرجاء إدخال كلمة المرور للمتابعة</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <Input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && authenticate()}
            className="mb-4"
          />

          <Button onClick={authenticate} disabled={loading} className="w-full">
            {loading ? "جاري التحقق..." : "دخول"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                لوحة التحكم - استطلاع الذكاء الاصطناعي
              </h1>
              <p className="text-gray-600">إدارة الجلسات ومتابعة النتائج</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-5 h-5 ml-2" />
              جلسة جديدة
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 ml-2" />
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4 flex items-center">
            <XCircle className="w-5 h-5 ml-2" />
            {error}
          </div>
        )}

        {/* Create Session Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  إنشاء جلسة جديدة
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان الجلسة
                  </label>
                  <Input
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="مثال: المشهد الأول - الطبيعة"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كود تضمين الفيديو من YouTube
                  </label>
                  <textarea
                    value={newSessionVideo}
                    onChange={(e) => setNewSessionVideo(e.target.value)}
                    placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/..." ...></iframe>'
                    className="w-full p-3 border border-gray-300 rounded-lg min-h-[120px] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    الصق كود iframe الكامل من YouTube
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الإجابة الصحيحة
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setNewSessionAnswer("A")}
                      className={`flex-1 p-4 rounded-lg border-2 font-semibold transition ${
                        newSessionAnswer === "A"
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-purple-400"
                      }`}
                    >
                      المشهد A
                    </button>
                    <button
                      onClick={() => setNewSessionAnswer("B")}
                      className={`flex-1 p-4 rounded-lg border-2 font-semibold transition ${
                        newSessionAnswer === "B"
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-purple-400"
                      }`}
                    >
                      المشهد B
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={createSession}
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? "جاري الإنشاء..." : "إنشاء الجلسة"}
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Statistics Modal */}
        {selectedStats && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedStats.session.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    الكود: {selectedStats.session.code} | الإجابة الصحيحة:{" "}
                    {selectedStats.session.correctAnswer}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStats(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">
                      إجمالي المشاركين
                    </div>
                    <div className="text-3xl font-bold text-purple-600">
                      {selectedStats.statistics.totalVotes}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">اختاروا A</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {selectedStats.statistics.percentageA}%
                    </div>
                    <div className="text-xs text-gray-500">
                      ({selectedStats.statistics.votesA} طالب)
                    </div>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">اختاروا B</div>
                    <div className="text-3xl font-bold text-pink-600">
                      {selectedStats.statistics.percentageB}%
                    </div>
                    <div className="text-xs text-gray-500">
                      ({selectedStats.statistics.votesB} طالب)
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">
                      الإجابات الصحيحة
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {selectedStats.statistics.percentageCorrect}%
                    </div>
                    <div className="text-xs text-gray-500">
                      ({selectedStats.statistics.correctVotes} طالب)
                    </div>
                  </div>
                </div>

                {/* Gender Breakdown */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Users className="w-5 h-5 ml-2 text-purple-600" />
                    التوزيع حسب الجنس
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">طلاب</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedStats.statistics.maleVotes}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({selectedStats.statistics.percentageMale}%)
                      </div>
                    </div>
                    <div className="bg-pink-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">طالبات</div>
                      <div className="text-2xl font-bold text-pink-600">
                        {selectedStats.statistics.femaleVotes}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({selectedStats.statistics.percentageFemale}%)
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Teacher Breakdown */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <BarChart3 className="w-5 h-5 ml-2 text-purple-600" />
                    التوزيع حسب المعلم/المعلمة
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {Object.entries(selectedStats.statistics.teacherBreakdown)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([teacher, stats]) => (
                        <div
                          key={teacher}
                          className="bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="font-medium text-gray-800 mb-2">
                            {teacher}
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">المجموع:</span>
                              <span className="font-semibold mr-1">
                                {stats.total}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">صحيح:</span>
                              <span className="font-semibold mr-1 text-green-600">
                                {stats.correct}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">A:</span>
                              <span className="font-semibold mr-1 text-blue-600">
                                {stats.answerA}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">B:</span>
                              <span className="font-semibold mr-1 text-pink-600">
                                {stats.answerB}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              </div>

              <Button
                onClick={() => loadStatistics(selectedStats.session.id)}
                className="w-full mt-4"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث الإحصائيات
              </Button>
            </Card>
          </div>
        )}

        {/* Sessions List */}
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {session.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        session.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {session.status === "active" ? "نشطة" : "مغلقة"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">الكود:</span> {session.code}
                    </p>
                    <p>
                      <span className="font-medium">الإجابة الصحيحة:</span>{" "}
                      {session.correctAnswer}
                    </p>
                    <p>
                      <span className="font-medium">عدد المشاركين:</span>{" "}
                      {session.voteCount}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/ai-poll/${session.id}`,
                        "رابط الجلسة",
                      )
                    }
                  >
                    <Copy className="w-4 h-4 ml-1" />
                    نسخ الرابط
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(session.code, "الكود")}
                  >
                    <Copy className="w-4 h-4 ml-1" />
                    نسخ الكود
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadStatistics(session.id)}
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    الإحصائيات
                  </Button>
                  {session.status === "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => closeSession(session.id)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Lock className="w-4 h-4 ml-1" />
                      إغلاق
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteSession(session.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {sessions.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <BarChart3 className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                لا توجد جلسات بعد
              </h3>
              <p className="text-gray-500 mb-4">ابدأ بإنشاء جلسة جديدة</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-5 h-5 ml-2" />
                إنشاء جلسة جديدة
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
