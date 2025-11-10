import { Rocket, Calendar, Trophy, Lightbulb, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function InnovationChallenge() {
  const openSubmissionForm = () => {
    window.open("YOUR_FORM_URL_HERE", "_blank");
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white" dir="rtl">
      {/* Page Content */}
      <div className="relative max-w-5xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            تحدي الابتكار بالذكاء الاصطناعي
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
            افتح آفاقك وورّنا شغفك في مشروعك القادم باستخدام الذكاء الاصطناعي
          </p>
          <Button
            onClick={openSubmissionForm}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-5 px-12 text-xl font-bold text-white"
          >
            🚀 قدّم مشروعك الآن
          </Button>
        </section>

        {/* How to Participate */}
        <section className="mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-6">كيف تشارك</h2>
              <ol className="space-y-4 text-lg">
                <li>1. ارفع رابط أو ملف مشروعك</li>
                <li>
                  2. كتب ٣ جمل بسيطة:
                  <ul className="list-disc ml-6 mt-2">
                    <li>وش يسوي المشروع؟</li>
                    <li>ليه مهم؟</li>
                    <li>وش تعلمت؟</li>
                  </ul>
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* Prizes */}
        <section className="mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Trophy className="w-8 h-8" />
                الجوائز
              </h2>
              <ul className="space-y-3 text-lg">
                <li>
                  • الجائزة الكبرى: iPad + Apple Pencil + عرض مشروعك في معرض نون
                </li>
                <li>
                  • أفضل ٥ مشاريع: عرض في المعرض + شهادة مشاركة + ميزات حصرية في
                  المنصة
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Project Ideas */}
        <section className="mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Lightbulb className="w-8 h-8" />
                أفكار مشاريع
              </h2>
              <ul className="space-y-3 text-lg">
                <li>• تطبيق ذكي يساعدك في حياتك اليومية</li>
                <li>• قصة رقمية أو مانجا مستقبلية</li>
                <li>• تجربة تعليمية أو لعبة تفاعلية</li>
              </ul>
              <p className="mt-4 text-gray-400">أفكارك أنت أفضل، خلك مبدع!</p>
            </CardContent>
          </Card>
        </section>

        {/* Need Help */}
        <section className="mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Users className="w-8 h-8" />
                محتاج مساعدة؟
              </h2>
              <div className="space-y-4 text-lg">
                <p>انضم لقناة Discord #mcit-challenge واسأل أي سؤال.</p>
                <p>
                  تعال بمشروعك لـ Weekend Innovation Space (كل سبت، ٤-٦ مساءً)
                </p>
                <p>أو راسلنا على البريد الإلكتروني [email]</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Final CTA */}
        <section className="text-center mb-16">
          <Button
            onClick={openSubmissionForm}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-5 px-12 text-xl font-bold text-white"
          >
            🚀 ابدأ التقديم الآن
          </Button>
        </section>
      </div>
    </div>
  );
}
