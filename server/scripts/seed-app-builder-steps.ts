/**
 * Seed script for App Builder Stream steps
 * Populates the database with the default 11 steps for the course
 */
import { storage } from "../storage";

// Define the 11 steps of the App Builder Stream
const appBuilderSteps = [
  {
    stepNumber: 1,
    title: "فهم احتياجات المستخدم",
    subtitle: "تحليل المشكلة وتحديد الجمهور المستهدف",
    content: "في هذه الخطوة، ستتعلم كيفية تحديد وفهم احتياجات المستخدمين لتطبيقك. قم بتحليل المشكلة التي يحاول تطبيقك حلها، وحدد الجمهور المستهدف، ثم اكتب وصفًا موجزًا لاحتياجات المستخدم.",
    submissionType: "text",
    requiredForProgress: true
  },
  {
    stepNumber: 2,
    title: "تصميم واجهة المستخدم (UI)",
    subtitle: "إنشاء تصميم أولي للشاشات الرئيسية",
    content: "قم بإنشاء تصميم أولي لواجهة المستخدم لتطبيقك. يمكنك استخدام الورق والقلم لرسم تخطيط الشاشات الرئيسية، أو استخدام أداة تصميم رقمية. ركز على تنظيم العناصر وتدفق المستخدم بين الشاشات.",
    submissionType: "text",
    requiredForProgress: true
  },
  {
    stepNumber: 3,
    title: "إنشاء هيكل HTML الأساسي",
    subtitle: "بناء هيكل صفحة الويب باستخدام HTML",
    content: "قم بإنشاء ملف HTML أساسي لتطبيقك. تأكد من تضمين العناصر الأساسية مثل الرأس والتذييل والمحتوى الرئيسي. اهتم بهيكلة العناصر بشكل منطقي باستخدام وسوم HTML المناسبة.",
    submissionType: "code",
    requiredForProgress: true
  },
  {
    stepNumber: 4,
    title: "تنسيق التطبيق باستخدام CSS",
    subtitle: "تحسين مظهر التطبيق باستخدام CSS",
    content: "أضف أنماط CSS لتحسين مظهر تطبيقك. ركز على تنسيق الألوان والخطوط والمسافات. تأكد من أن التصميم متجاوب ويعمل بشكل جيد على مختلف أحجام الشاشات.",
    submissionType: "code",
    requiredForProgress: true
  },
  {
    stepNumber: 5,
    title: "إضافة التفاعلية مع JavaScript",
    subtitle: "جعل التطبيق تفاعليًا باستخدام JavaScript",
    content: "أضف وظائف JavaScript أساسية لتطبيقك لجعله تفاعليًا. يمكنك إضافة مستمعات للأحداث للأزرار، وإنشاء نماذج، أو إضافة تحقق من صحة المدخلات.",
    submissionType: "code",
    requiredForProgress: true
  },
  {
    stepNumber: 6,
    title: "ربط التطبيق بواجهة برمجة التطبيقات (API)",
    subtitle: "استخدام APIs للحصول على البيانات وإرسالها",
    content: "تعلم كيفية استخدام الـ fetch API أو Axios لإجراء طلبات HTTP لواجهات برمجة التطبيقات. قم بتنفيذ استدعاءات بسيطة للحصول على البيانات أو إرسالها.",
    submissionType: "code",
    requiredForProgress: true
  },
  {
    stepNumber: 7,
    title: "إدارة حالة التطبيق",
    subtitle: "استخدام التخزين المحلي لحفظ البيانات",
    content: "تعلم كيفية إدارة حالة التطبيق باستخدام التخزين المحلي (localStorage) أو IndexedDB. قم بتنفيذ وظائف لحفظ بيانات المستخدم واستعادتها بين جلسات التصفح.",
    submissionType: "code",
    requiredForProgress: true
  },
  {
    stepNumber: 8,
    title: "اختبار التطبيق وإصلاح الأخطاء",
    subtitle: "التأكد من عمل التطبيق بشكل صحيح",
    content: "قم باختبار تطبيقك للتأكد من أنه يعمل كما هو متوقع. تحقق من وجود أخطاء في وحدة التحكم وقم بإصلاحها. اختبر تطبيقك على مختلف المتصفحات وأحجام الشاشات.",
    submissionType: "text",
    requiredForProgress: true
  },
  {
    stepNumber: 9,
    title: "تحسين الأداء",
    subtitle: "تحسين سرعة وكفاءة التطبيق",
    content: "تعلم كيفية تحسين أداء تطبيقك. قم بضغط الصور، وتقليل حجم ملفات CSS و JavaScript، واستخدم تقنيات التحميل الكسول للعناصر الغير مرئية على الشاشة.",
    submissionType: "text",
    requiredForProgress: true
  },
  {
    stepNumber: 10,
    title: "جعل التطبيق متاحًا للجميع",
    subtitle: "تحسين إمكانية الوصول",
    content: "قم بتحسين إمكانية الوصول في تطبيقك. تأكد من أن تطبيقك يمكن استخدامه بواسطة الأشخاص ذوي الإعاقة. استخدم النصوص البديلة للصور وتأكد من أن التباين بين الألوان كافٍ.",
    submissionType: "text",
    requiredForProgress: true
  },
  {
    stepNumber: 11,
    title: "نشر التطبيق",
    subtitle: "مشاركة تطبيقك مع العالم",
    content: "تعلم كيفية نشر تطبيقك على الإنترنت. استخدم خدمات الاستضافة المجانية مثل GitHub Pages أو Netlify لعرض تطبيقك للعالم.",
    submissionType: "link",
    requiredForProgress: true
  }
];

async function seedAppBuilderSteps() {
  console.log("🌱 بدء عملية إضافة خطوات مسار بناء التطبيق...");
  
  try {
    // Get all existing steps
    const existingSteps = await storage.getAllAppBuilderSteps();
    
    // Create or update each step
    for (const stepData of appBuilderSteps) {
      const existingStep = existingSteps.find(s => s.stepNumber === stepData.stepNumber);
      
      if (existingStep) {
        // Update existing step
        console.log(`تحديث الخطوة ${stepData.stepNumber}: ${stepData.title}`);
        await storage.updateAppBuilderStep(stepData.stepNumber, stepData);
      } else {
        // Create new step
        console.log(`إنشاء الخطوة ${stepData.stepNumber}: ${stepData.title}`);
        await storage.createAppBuilderStep(stepData);
      }
    }
    
    console.log("✅ تم إضافة جميع خطوات مسار بناء التطبيق بنجاح!");
  } catch (error) {
    console.error("❌ حدث خطأ أثناء إضافة خطوات مسار بناء التطبيق:", error);
  }
}

// No need to check if it's the main module in ES modules
// The function will be imported and executed from server/index.ts

export { seedAppBuilderSteps };