import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ResetInstructions() {
  const [, navigate] = useLocation();
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="max-w-xl w-full bg-card p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">
          إعادة تعيين الجلسة
        </h1>
        
        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <p className="mb-4 text-center font-semibold">
              لإعادة تعيين جلستك وبدء تطبيق GenAI Quest من جديد، اتبع هذه الخطوات:
            </p>
            
            <ol className="list-decimal list-inside space-y-2 mr-4">
              <li>انقر على الزر أدناه للانتقال إلى صفحة إعادة التعيين</li>
              <li>تأكد من رغبتك في مسح جميع بياناتك المحلية</li>
              <li>اضغط على زر "نعم، امسح جلستي وابدأ من جديد"</li>
              <li>سيتم توجيهك إلى الصفحة الرئيسية تلقائيًا بعد إعادة التعيين</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-center text-amber-800">
              <strong>ملاحظة مهمة:</strong> سيؤدي هذا إلى إزالة جميع بياناتك المحلية بما في ذلك:
            </p>
            <ul className="list-disc list-inside mr-4 mt-2 text-amber-800">
              <li>تقدمك في المهام</li>
              <li>محادثاتك مع د. بنجي</li>
              <li>نقاط الخبرة والشارات التي حصلت عليها</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-4 mt-6">
            <Button
              onClick={() => navigate("/reset")}
              size="lg"
              className="w-full"
            >
              انتقل إلى صفحة إعادة التعيين
            </Button>
            
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="w-full"
            >
              إلغاء والعودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}