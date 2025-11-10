import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const REACTION_EMOJIS = ["🔥", "😂", "💯", "👏", "❤️", "⭐"];

const STORY_THEMES = [
  {
    value: "عودة بنجي",
    emoji: "🐧",
    label: "عودة بنجي",
  },
  {
    value: "قصة من اختيارك",
    emoji: "✨",
    label: "قصة من اختيارك",
  },
  {
    value: "ضائع في الغابة",
    emoji: "🌴",
    label: "القصة الفائزة الأسبوع الماضي: ضائع في الغابة",
  },
];

const STORY_SECTIONS = [
  {
    title: "بداية القصة",
    instruction:
      "فكّر كيف بتبدأ قصتك: عرّفنا على الشخصيات والمكان، ووش الشي اللي يصير بالبداية ويحرّك الأحداث.",
    index: 0,
  },
  {
    title: "وسط القصة",
    instruction:
      "الحين كمّل الأحداث! وش التحدّي أو المشكلة؟ كيف تتصاعد الأمور مع الشخصيات؟",
    index: 1,
  },
  {
    title: "نهاية القصة",
    instruction:
      "اختم قصتك بطريقة واضحة: وش صار بالنهاية؟ كيف انحلّت المشكلة أو وش تعلّموا الأبطال؟",
    index: 2,
  },
];

interface Event {
  description: string;
}

interface Feedback {
  type: "comment" | "reaction";
  content: string;
  author: string;
  timestamp: string;
}

// Cookie utilities
const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

export default function MangaStoryPlanner() {
  const [authorName, setAuthorName] = useState("");
  const [theme, setTheme] = useState("");
  const [storySummary, setStorySummary] = useState("");
  const [events, setEvents] = useState<Event[]>(
    Array(3)
      .fill(null)
      .map(() => ({
        description: "",
      })),
  );
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commenterName, setCommenterName] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Load from cookies on mount
  useEffect(() => {
    const savedAuthorName = getCookie("manga_authorName");
    const savedTheme = getCookie("manga_theme");
    const savedStorySummary = getCookie("manga_storySummary");
    const savedEvents = getCookie("manga_events");

    if (savedAuthorName) setAuthorName(savedAuthorName);
    if (savedTheme) setTheme(savedTheme);
    if (savedStorySummary) setStorySummary(savedStorySummary);
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        if (parsed.length === 3) {
          setEvents(parsed);
        } else {
          // Reset if old format
          setEvents(
            Array(3)
              .fill(null)
              .map(() => ({ description: "" })),
          );
        }
      } catch (e) {
        console.error("Error parsing saved events:", e);
      }
    }
  }, []);

  // Save to cookies when data changes
  useEffect(() => {
    if (authorName) setCookie("manga_authorName", authorName);
  }, [authorName]);

  useEffect(() => {
    if (theme) setCookie("manga_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (storySummary) setCookie("manga_storySummary", storySummary);
  }, [storySummary]);

  useEffect(() => {
    setCookie("manga_events", JSON.stringify(events));
  }, [events]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const updateEvent = (eventIndex: number, description: string) => {
    const newEvents = [...events];
    newEvents[eventIndex].description = description;
    setEvents(newEvents);
  };

  const addFeedback = (type: "comment" | "reaction", content: string) => {
    if (type === "comment" && !content.trim()) {
      showToast("يرجى كتابة تعليق");
      return;
    }

    if (type === "comment" && !commenterName.trim()) {
      showToast("يرجى كتابة اسمك");
      return;
    }

    const newFeedback: Feedback = {
      type,
      content,
      author: type === "comment" ? commenterName : "مجهول",
      timestamp: new Date().toISOString(),
    };

    setFeedback([...feedback, newFeedback]);
    setNewComment("");
    setCommenterName("");

    showToast(type === "comment" ? "تم إضافة تعليقك" : "تم إضافة تفاعلك");
  };

  const evaluateStory = async () => {
    if (!theme.trim()) {
      showToast("يرجى اختيار موضوع القصة");
      return;
    }

    if (!storySummary.trim()) {
      showToast("يرجى كتابة ملخص القصة");
      return;
    }

    const filledEvents = events.filter((e) => e.description.trim()).length;
    if (filledEvents < 3) {
      showToast("يرجى إكمال جميع الأقسام الثلاثة");
      return;
    }

    setIsEvaluating(true);

    try {
      const response = await fetch("/api/manga/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorName,
          theme,
          storySummary,
          events,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "فشل في تقييم القصة");
      }

      const data = await response.json();

      setScore(data.score);
      setAiFeedback(data.feedback);
      setImprovements(data.improvements || []);
      showToast("تم التقييم بنجاح!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ في التقييم";
      showToast(errorMessage);
      console.error("Evaluation error:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4"
      dir="rtl"
    >
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toastMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <Card className="shadow-xl mb-6">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold text-purple-900 mb-6 text-center">
              🎨 مخطط قصة المانجا
            </h1>

            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-900 mb-2">
                اسمك:
              </label>
              <Input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="مثال: أحمد"
                className="text-lg"
              />
            </div>

            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-900 mb-3">
                اختر موضوع قصتك:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STORY_THEMES.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => setTheme(themeOption.value)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === themeOption.value
                        ? "border-purple-500 bg-purple-100 shadow-lg scale-105"
                        : "border-gray-300 bg-white hover:border-purple-300 hover:shadow-md"
                    }`}
                  >
                    <div className="text-4xl mb-3">{themeOption.emoji}</div>
                    <div className="font-bold text-gray-800 text-lg">
                      {themeOption.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-900 mb-2">
                ملخص القصة (جملتين):
              </label>
              <Textarea
                value={storySummary}
                onChange={(e) => setStorySummary(e.target.value)}
                placeholder="مثال: بنجي يقرأ تعليقات سلبية عن أدائه. يقرر أن يتدرب بجد ويعود أقوى من قبل."
                className="text-lg"
                rows={3}
              />
            </div>

            {STORY_SECTIONS.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-8">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-xl p-4 mb-4">
                  <h3 className="text-2xl font-bold mb-2">{section.title}</h3>
                  <p className="text-sm opacity-90">{section.instruction}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300">
                  <div className="text-center mb-4">
                    <span className="font-bold text-purple-900 text-xl">
                      اكتب أفكارك
                    </span>
                  </div>

                  <Textarea
                    value={events[section.index].description}
                    onChange={(e) => updateEvent(section.index, e.target.value)}
                    placeholder="اكتب أفكارك لهذا القسم من القصة..."
                    className="text-base resize-none min-h-[150px]"
                    rows={6}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-4 text-center">
              ⭐ تقييم القصة
            </h2>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                💡 احصل على تقييم ذكي لبنية قصتك مع اقتراحات للتحسين!
              </p>
            </div>

            <Button
              onClick={evaluateStory}
              disabled={isEvaluating}
              className="w-full mb-6"
              size="lg"
            >
              {isEvaluating ? "جاري التقييم..." : "📊 قيّم قصتي"}
            </Button>

            {score !== null && aiFeedback && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6">
                <div className="text-center mb-6">
                  <div className="inline-block bg-white rounded-full px-8 py-4 shadow-lg">
                    <span className="text-5xl font-bold text-purple-900">
                      {score}/10
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm mb-4">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                    <span>✨</span>
                    نقاط القوة:
                  </h3>
                  <p className="text-gray-800 leading-relaxed text-base">
                    {aiFeedback}
                  </p>
                </div>

                {improvements.length > 0 && (
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                      <span>💡</span>
                      اقتراحات للتحسين:
                    </h3>
                    <ul className="space-y-3">
                      {improvements.map((improvement, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-gray-800 text-base"
                        >
                          <span className="text-purple-600 font-bold mt-1">
                            {index + 1}.
                          </span>
                          <span className="leading-relaxed">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* <Card className="shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              💬 التعليقات والتفاعلات
            </h2>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-3">
                ⏰ <strong>فترة الراحة:</strong> شارك قصتك مع أصدقائك الآن! دعهم
                يتركون تعليقاتهم أدناه 👇
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  اسمك (للمعلق):
                </label>
                <Input
                  type="text"
                  value={commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  placeholder="اكتب اسمك..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  تعليقك:
                </label>
                <div className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="اكتب تعليقك هنا..."
                    rows={3}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button
                onClick={() => addFeedback("comment", newComment)}
                disabled={!newComment.trim() || !commenterName.trim()}
                className="w-full"
              >
                <Send className="w-5 h-5 ml-2" />
                إرسال التعليق
              </Button>
            </div>

            <div className="flex gap-2 mb-6 items-center justify-center flex-wrap">
              <span className="text-gray-600 font-bold">تفاعل سريع:</span>
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addFeedback("reaction", emoji)}
                  className="text-3xl hover:scale-125 transition-transform bg-white rounded-lg p-2 shadow-md hover:shadow-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">💭</span>
                جميع التعليقات ({feedback.length})
              </h3>

              {feedback.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-lg">
                    لا توجد تعليقات بعد... كن أول من يعلق! 🎉
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedback.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border-l-4 border-purple-500"
                    >
                      {item.type === "comment" ? (
                        <div>
                          <p className="font-bold text-purple-900 mb-1">
                            {item.author}
                          </p>
                          <p className="text-gray-800">{item.content}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{item.content}</span>
                          <span className="text-gray-500 text-sm">
                            تفاعل من صديق
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(item.timestamp).toLocaleString("ar-SA")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
