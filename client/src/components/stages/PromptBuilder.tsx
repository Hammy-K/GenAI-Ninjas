import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Sparkles, ArrowRight, ArrowLeft, Copy } from "lucide-react";

interface PromptBuilderProps {
  onComplete?: (finalPrompt: string) => void;
}

type QuestionStep = {
  id: number;
  question: string;
  placeholder: string;
  hint: string;
  emoji: string;
};

const QUESTIONS: QuestionStep[] = [
  {
    id: 1,
    question: "ما هو؟",
    placeholder: "مثال: تطبيق يساعد الطلاب على حفظ القرآن...",
    hint: "اشرح فكرة التطبيق في جملة واحدة",
    emoji: "💡",
  },
  {
    id: 2,
    question: "كيف يبدو؟",
    placeholder: "مثال: خلفية زرقاء فاتحة، بطاقات كبيرة، أزرار ملونة...",
    hint: "صف الألوان، التخطيط، والعناصر المرئية",
    emoji: "🎨",
  },
  {
    id: 3,
    question: "ماذا يفعل؟",
    placeholder: "مثال: المستخدم يختار سورة، يستمع للآية، ثم يسجل قراءته...",
    hint: "اشرح كيف يتفاعل المستخدم مع التطبيق",
    emoji: "⚡",
  },
  {
    id: 4,
    question: "متطلبات خاصة؟",
    placeholder: "مثال: يدعم العربية RTL، يستخدم AI لتصحيح القراءة...",
    hint: "أي متطلبات تقنية أو ثقافية خاصة",
    emoji: "🔧",
  },
];

export function PromptBuilder({ onComplete }: PromptBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [showFinalPrompt, setShowFinalPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];
  const isLastStep = currentStep === QUESTIONS.length - 1;
  const canProceed = answers[currentStep].trim().length > 10;

  const handleNext = () => {
    if (isLastStep) {
      setShowFinalPrompt(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateAnswer = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    setAnswers(newAnswers);
  };

  const generateFinalPrompt = () => {
    return `أبني تطبيق ${answers[0]}. التصميم: ${answers[1]}. الوظيفة: ${answers[2]}. المتطلبات: ${answers[3]}.`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateFinalPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPercentage = ((currentStep + 1) / QUESTIONS.length) * 100;

  if (showFinalPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 md:p-8 bg-[#f8f4f0]">
        <div className="w-full max-w-4xl">
          {/* Success Animation */}
          <div className="text-center mb-12 animate-in fade-in zoom-in duration-500">
            <div className="text-8xl mb-6">🎉</div>
            <h1 className="text-5xl md:text-6xl font-bold text-[#2d3748] mb-4">
              ممتاز!
            </h1>
            <p className="text-xl text-[#718096]">هذا هو البرومبت الخاص بك</p>
          </div>

          {/* Final Prompt Display */}
          <div className="bg-white rounded-3xl p-10 shadow-2xl border border-[#e2e8f0] mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2d3748] flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                برومبت البداية
              </h2>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "تم النسخ!" : "نسخ"}
              </Button>
            </div>
            <div className="bg-[#f8f4f0] rounded-2xl p-8">
              <p className="text-xl text-[#2d3748] leading-relaxed">
                {generateFinalPrompt()}
              </p>
            </div>
          </div>

          {/* What They Did Well */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-3xl p-8 mb-8">
            <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
              <Check className="h-6 w-6" />
              ما اللي سويته صح
            </h3>
            <ul className="space-y-3 text-green-700 text-lg">
              <li className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <span>وضحت الفكرة بشكل واضح ومباشر</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <span>وصفت التصميم بتفاصيل مفيدة</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <span>شرحت كيف يعمل التطبيق</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <span>ذكرت المتطلبات الخاصة</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setShowFinalPrompt(false);
                setCurrentStep(0);
                setAnswers(["", "", "", ""]);
              }}
              variant="outline"
              className="flex-1 py-7 text-lg rounded-2xl"
            >
              ابدأ من جديد
            </Button>
            <Button
              onClick={() => onComplete?.(generateFinalPrompt())}
              className="flex-1 py-7 text-lg rounded-2xl bg-gradient-to-r from-[#4299e1] to-[#3182ce] hover:from-[#3182ce] hover:to-[#2c5282]"
            >
              ابني التطبيق الآن! 🚀
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-8 bg-[#f8f4f0]">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-[#4a5568]">
              السؤال {currentStep + 1} من {QUESTIONS.length}
            </span>
            <span className="text-lg font-semibold text-[#4299e1]">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-[#e2e8f0] h-3 rounded-full overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-[#4299e1] to-[#3182ce] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl p-10 shadow-2xl border border-[#e2e8f0] mb-8 animate-in fade-in slide-in-from-right-5 duration-500">
          {/* Question Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{currentQuestion.emoji}</div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#2d3748] mb-3">
              {currentQuestion.question}
            </h2>
            <p className="text-lg text-[#718096]">{currentQuestion.hint}</p>
          </div>

          {/* Input Area */}
          <Textarea
            value={answers[currentStep]}
            onChange={(e) => updateAnswer(e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="min-h-[180px] text-lg md:text-xl bg-[#f8f4f0] border-2 border-[#e2e8f0] rounded-2xl focus:border-[#4299e1] transition-all resize-none focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed p-6 mb-4"
            dir="auto"
          />

          {/* AI Feedback */}
          {answers[currentStep].length > 0 && (
            <div
              className={`p-4 rounded-xl mb-6 transition-all duration-300 ${
                canProceed
                  ? "bg-green-50 border-2 border-green-300"
                  : "bg-amber-50 border-2 border-amber-300"
              }`}
            >
              <p
                className={`text-base flex items-center gap-2 ${
                  canProceed ? "text-green-700" : "text-amber-700"
                }`}
              >
                {canProceed ? (
                  <>
                    <Check className="h-5 w-5" />
                    رائع! هذا واضح جداً ✨
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    جرب تضيف تفاصيل أكثر شوية...
                  </>
                )}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {currentStep > 0 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 py-7 text-lg rounded-2xl flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                السابق
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className={`py-7 text-lg rounded-2xl flex items-center justify-center gap-2 bg-gradient-to-r from-[#4299e1] to-[#3182ce] hover:from-[#3182ce] hover:to-[#2c5282] disabled:opacity-50 disabled:cursor-not-allowed ${
                currentStep === 0 ? "flex-1" : "flex-1"
              }`}
            >
              {isLastStep ? "اعرض البرومبت" : "التالي"}
              {!isLastStep && <ArrowRight className="h-5 w-5" />}
              {isLastStep && <Sparkles className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mini Preview (collapsed) */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#e2e8f0] opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#718096] flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              معاينة البرومبت
            </span>
            <span className="text-xs text-[#a0aec0]">
              {answers.filter((a) => a.length > 0).length} / {QUESTIONS.length}
            </span>
          </div>
          <p className="text-sm text-[#4a5568] leading-relaxed line-clamp-2">
            {answers.filter((a) => a.length > 0).length === 0
              ? "سيظهر برومبتك هنا بعد الإجابة على الأسئلة..."
              : generateFinalPrompt()}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-3 mt-8">
          {QUESTIONS.map((_, index) => (
            <div
              key={index}
              className={`h-3 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-12 bg-gradient-to-r from-[#4299e1] to-[#3182ce]"
                  : index < currentStep
                    ? "w-3 bg-green-500"
                    : "w-3 bg-[#e2e8f0]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
