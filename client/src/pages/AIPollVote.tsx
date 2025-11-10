import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, User, Video } from "lucide-react";

interface SessionData {
  id: number;
  code: string;
  title: string;
  videoEmbed: string;
  status: string;
}

export default function AIPollVote() {
  const { identifier } = useParams<{ identifier: string }>();
  const [step, setStep] = useState<"info" | "video" | "result">("info");
  const [session, setSession] = useState<SessionData | null>(null);

  // Form state
  const [studentName, setStudentName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherNameOther, setTeacherNameOther] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | "">("");

  // Teacher lists
  const [maleTeachers, setMaleTeachers] = useState<string[]>([]);
  const [femaleTeachers, setFemaleTeachers] = useState<string[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    loadSession();
    loadTeachers();
  }, [identifier]);

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/ai-poll/session/${identifier}`);
      const data = await response.json();

      if (response.ok) {
        setSession(data);
      } else {
        setError(data.error || "الجلسة غير موجودة");
      }
    } catch (err) {
      setError("حدث خطأ في تحميل الجلسة");
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await fetch("/api/ai-poll/teachers");
      const data = await response.json();
      setMaleTeachers(data.male);
      setFemaleTeachers(data.female);
    } catch (err) {
      console.error("Error loading teachers:", err);
    }
  };

  const submitInfo = () => {
    if (!studentName || !gender || !teacherName) {
      setError("الرجاء إكمال جميع الحقول");
      return;
    }

    if (teacherName.includes("أخرى") && !teacherNameOther) {
      setError("الرجاء كتابة اسم المعلم/المعلمة");
      return;
    }

    setError("");
    setStep("video");
  };

  const submitVote = async () => {
    if (!selectedAnswer) {
      setError("الرجاء اختيار إجابتك");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/ai-poll/session/${session?.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          teacherName,
          teacherNameOther,
          gender,
          selectedAnswer,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCorrect(data.isCorrect);
        setStep("result");
      } else {
        setError(data.error || "حدث خطأ في تسجيل الإجابة");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال");
    }
    setLoading(false);
  };

  const getFilteredTeachers = () => {
    const teachers = gender === "male" ? maleTeachers : femaleTeachers;
    if (!teacherSearch) return teachers;
    return teachers.filter((t) => t.includes(teacherSearch));
  };

  if (error && !session) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4"
        dir="rtl"
      >
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">عذراً</h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {session.title}
          </h1>
          <p className="text-gray-600">
            أيهما حقيقي؟ وأيهما مولد بالذكاء الاصطناعي؟
          </p>
        </div>

        {/* Step 1: Student Info */}
        {step === "info" && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              معلوماتك الشخصية
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center">
                <XCircle className="w-5 h-5 ml-2" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسمك الكامل <span className="text-red-500">*</span>
                </label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="أدخل اسمك"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الجنس <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setGender("male");
                      setTeacherName("");
                    }}
                    className={`p-4 rounded-lg border-2 font-semibold transition ${
                      gender === "male"
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-purple-400"
                    }`}
                  >
                    طالب
                  </button>
                  <button
                    onClick={() => {
                      setGender("female");
                      setTeacherName("");
                    }}
                    className={`p-4 rounded-lg border-2 font-semibold transition ${
                      gender === "female"
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-purple-400"
                    }`}
                  >
                    طالبة
                  </button>
                </div>
              </div>

              {gender && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {gender === "male" ? "اسم المعلم" : "اسم المعلمة"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="ابحث عن اسم المعلم/المعلمة"
                    className="mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                    {getFilteredTeachers().map((teacher) => (
                      <button
                        key={teacher}
                        onClick={() => setTeacherName(teacher)}
                        className={`w-full text-right p-3 hover:bg-purple-50 transition border-b border-gray-200 ${
                          teacherName === teacher
                            ? "bg-purple-100 font-semibold"
                            : ""
                        }`}
                      >
                        {teacher}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {teacherName.includes("أخرى") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اكتب اسم {gender === "male" ? "المعلم" : "المعلمة"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={teacherNameOther}
                    onChange={(e) => setTeacherNameOther(e.target.value)}
                    placeholder="أدخل الاسم"
                  />
                </div>
              )}

              <Button onClick={submitInfo} className="w-full mt-6">
                التالي - مشاهدة الفيديو
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Video & Voting */}
        {step === "video" && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              شاهد الفيديو واختر إجابتك
            </h2>

            <div className="mb-6">
              <div
                className="relative w-full"
                style={{ paddingBottom: "56.25%" }}
                dangerouslySetInnerHTML={{
                  __html: session.videoEmbed
                    .replace(/width="[^"]*"/, 'width="100%"')
                    .replace(/height="[^"]*"/, 'height="100%"')
                    .replace(
                      /<iframe/,
                      '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"',
                    ),
                }}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center">
                <XCircle className="w-5 h-5 ml-2" />
                {error}
              </div>
            )}

            <div className="mb-6">
              <p className="text-center text-gray-700 font-medium mb-4">
                أي المشاهد تم توليده بالذكاء الاصطناعي؟
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedAnswer("A")}
                  className={`p-6 rounded-lg border-2 font-bold text-xl transition ${
                    selectedAnswer === "A"
                      ? "border-purple-600 bg-purple-50 text-purple-700 scale-105"
                      : "border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:scale-105"
                  }`}
                >
                  المشهد A
                </button>
                <button
                  onClick={() => setSelectedAnswer("B")}
                  className={`p-6 rounded-lg border-2 font-bold text-xl transition ${
                    selectedAnswer === "B"
                      ? "border-purple-600 bg-purple-50 text-purple-700 scale-105"
                      : "border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:scale-105"
                  }`}
                >
                  المشهد B
                </button>
              </div>
            </div>

            <Button
              onClick={submitVote}
              disabled={!selectedAnswer || loading}
              className="w-full"
            >
              {loading ? "جاري الإرسال..." : "إرسال إجابتي"}
            </Button>
          </Card>
        )}

        {/* Step 3: Result */}
        {step === "result" && (
          <Card className="p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isCorrect ? "bg-green-100" : "bg-orange-100"
              }`}
            >
              {isCorrect ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-orange-600" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {isCorrect ? "أحسنت! إجابتك صحيحة! 🎉" : "إجابتك غير صحيحة"}
            </h2>

            <p className="text-gray-600 text-lg mb-6">
              {isCorrect
                ? "لديك عين ثاقبة! استطعت التمييز بين الحقيقي والمولد بالذكاء الاصطناعي"
                : "لا تقلق، أحياناً يكون من الصعب التمييز بين المشاهد الحقيقية والمولدة بالذكاء الاصطناعي"}
            </p>

            <div className="bg-purple-50 p-6 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2">
                شكراً لمشاركتك!
              </p>
              <p className="text-sm text-gray-600">
                تم تسجيل إجابتك بنجاح. معلمك/معلمتك يمكنهم الآن رؤية النتائج في
                لوحة التحكم.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
