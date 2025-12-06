import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  ExternalLink,
  FileText,
  MessageSquare,
  Rocket,
  Lightbulb,
} from "lucide-react";

const META_PROMPT = `أنت خبير في تصميم المنتجات وبناء التطبيقات باستخدام Lovable.dev.

أرفقت لك ملف PDF يحتوي على:
- المشكلة التي نحاول حلها
- المستخدمين المستهدفين (طلاب، معلمين، قادة مدارس)
- الحل المقترح
- أهم الملاحظات من ورشة الأيام 1–3

مهمتك:
1. قراءة محتوى الـPDF وفهمه.
2. استخراج أهم العناصر: المشكلة، المستخدم، الهدف، المزايا الأساسية.
3. تحويل هذه العناصر إلى "برومبت جاهز للنسخ" يمكنني لصقه مباشرة في Lovable لبناء أول نسخة من التطبيق.

⚠️ ملاحظة مهمة:
اكتب البرومبت النهائي بأسلوب موجّه إلى Lovable مباشرة، مثل:
"Build a web app that…"

ويجب أن يحتوي البرومبت النهائي على هذه الأقسام:

---

**Title:**  
اسم التطبيق (قصير وواضح)

**Goal:**  
٣–١ نقاط مختصرة توضح الهدف الرئيسي للتطبيق.

**Target Users:**  
من سيستخدم هذا التطبيق؟

**Core Features & Flows:**  
٣–٥ مسارات رئيسية مكتوبة كمراحل استخدام.  
مثال:  
"User logs in → adds a class → uploads submissions → tracks progress."

**Pages / Screens:**  
قائمة بالصفحات المطلوبة + شرح بسيط لكل صفحة.

**Data Model:**  
تعريف الجداول الأساسية والحقول، مثل:  
Student, Class, Submission, Feedback

**UI Language & Layout:**  
All user-facing text must be in Arabic (Modern Standard Arabic).  
Use full RTL layout.  
Keep system logic and architecture instructions in English for accuracy.

**Nice to Have:**  
٢–١ تحسينات بسيطة إن أمكن.

---

بعد تحليل الـPDF، أريد منك أن تخرج بـ **البرومبت النهائي فقط** بدون شرح إضافي.`;

export default function AIAppHelper() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(META_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <motion.header
          className="text-center space-y-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            من عرض تقديمي إلى تطبيق حقيقي 🚀
          </h1>
          <p className="text-muted-foreground text-lg">
            ثلاث خطوات بسيطة: PDF → ChatGPT → Lovable
          </p>
        </motion.header>

        {/* Steps */}
        <div className="space-y-6">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded">
                        ١
                      </span>
                      <h2 className="text-xl font-bold">جهّز ملفك</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      حوّل عرضك التقديمي (Days 1–3) إلى PDF
                    </p>
                  </div>

                  <Button
                    onClick={() => window.open("https://chatgpt.com", "_blank")}
                    className="gap-2"
                  >
                    <span>فتح ChatGPT</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded">
                        ٢
                      </span>
                      <h2 className="text-xl font-bold">
                        انسخ البرومبت إلى ChatGPT
                      </h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      ارفع الـPDF + الصق البرومبت
                    </p>
                  </div>

                  {/* Meta Prompt Box */}
                  <div className="relative">
                    <div className="bg-muted/50 border rounded-lg p-4 max-h-48 overflow-y-auto text-sm font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {META_PROMPT}
                    </div>

                    <Button
                      onClick={handleCopy}
                      variant={copied ? "default" : "secondary"}
                      className="mt-3 w-full gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>تم نسخ البرومبت ✅</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>نسخ البرومبت</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Quick Steps */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-1 rounded">
                      ١) انسخ البرومبت
                    </span>
                    <span className="bg-muted px-2 py-1 rounded">
                      ٢) ارفع PDF في ChatGPT
                    </span>
                    <span className="bg-muted px-2 py-1 rounded">
                      ٣) الصق البرومبت
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded">
                        ٣
                      </span>
                      <h2 className="text-xl font-bold">ابنِ التطبيق</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      انسخ برومبت ChatGPT → الصقه في Lovable → شغّل
                    </p>
                  </div>

                  <Button
                    onClick={() => window.open("https://lovable.dev", "_blank")}
                    className="gap-2"
                  >
                    <span>فتح Lovable</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-5 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <h3 className="font-bold text-foreground">نصائح سريعة</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• ركّز على جزء صغير من الحل</li>
                  <li>• البرومبت الطويل عادي، انسخه كامل</li>
                  <li>• الهدف نموذج أولي، مو تطبيق مثالي</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          ما يحتاج ترفع أي ملف هنا • كل الرفع داخل ChatGPT
        </p>
      </div>
    </div>
  );
}
