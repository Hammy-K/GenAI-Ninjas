import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Image,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Award,
  ArrowLeft,
} from "lucide-react";
import { useLocation } from "wouter";
import { trackStageProgress } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

interface WrapUpStageProps {
  onRestart: () => void;
  totalXp: number;
  unlockedBadges: string[];
  onCompleteMission?: (missionId: number) => void;
}

export function WrapUpStage({
  onRestart,
  totalXp,
  unlockedBadges,
  onCompleteMission,
}: WrapUpStageProps) {
  const [location, navigate] = useLocation();

  // Handle mission completion and return to dashboard
  const handleCompleteMission = () => {
    if (onCompleteMission) {
      // First log the completion with analytics
      try {
        trackStageProgress("mission1", "mission_completed", {
          badges_earned: unlockedBadges.length,
          total_xp: totalXp,
        });
      } catch (error) {
        console.error("Error tracking mission completion:", error);
      }

      // Complete Mission 1
      onCompleteMission(1);
      console.log("Mission 1 completion triggered");
    } else {
      console.log("Mission completion function not available");
    }

    // Show success toast message
    toast({
      title: "تهانينا!",
      description: "لقد أكملت المهمة الأولى بنجاح!",
      variant: "default",
      duration: 5000,
    });

    // Navigate back to dashboard after a short delay to allow state to update
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  const badges = [
    {
      id: "prompt_engineer_badge",
      name: "Prompt Engineer",
      icon: <MessageSquare className="h-8 w-8" />,
      description: "Created effective AI prompts",
    },
    {
      id: "image_artist_badge",
      name: "Image Artist",
      icon: <Image className="h-8 w-8" />,
      description: "Generated AI images",
    },
    {
      id: "ai_coder_badge",
      name: "AI-Coder",
      icon: <Sparkles className="h-8 w-8" />,
      description: "Built a web app with AI",
    },
  ];

  return (
    <div className="wrap-up-stage">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">
              مبروك! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-8">
              <p className="mb-4">
                أكملت المهمة الأولى في رحلة الذكاء الاصطناعي التوليدي بنجاح
                وحصلت على معرفة قيمة.
              </p>

              <div className="bg-primary/10 text-primary font-bold text-xl rounded-full px-6 py-3 inline-block">
                {totalXp} نقطة خبرة
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-center">
                الشارات المكتسبة
              </h3>
              <div className="flex justify-center gap-8 mx-auto">
                {badges.map((badge) => {
                  const isUnlocked = unlockedBadges.includes(badge.id);

                  return (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center text-center"
                    >
                      <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 
                        ${isUnlocked ? "bg-primary text-white" : "bg-neutral-200 text-neutral-400"}`}
                      >
                        <span className="h-8 w-8">{badge.icon}</span>
                      </div>
                      <span
                        className={`text-sm font-medium ${isUnlocked ? "text-primary" : "text-neutral-500"}`}
                      >
                        {badge.id === "prompt_engineer_badge" && "مهندس تحفيز"}
                        {badge.id === "image_artist_badge" && "فنان الصور"}
                        {badge.id === "ai_coder_badge" && "مبرمج ذكاء اصطناعي"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-neutral-50 p-4 rounded-lg border">
              <h3 className="font-bold mb-3">ما تعلمته:</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                  <span>فهم أساسيات الذكاء الاصطناعي التوليدي</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                  <span>إنشاء تحفيزات فعالة لأنظمة الذكاء الاصطناعي</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                  <span>توليد النصوص والصور باستخدام الذكاء الاصطناعي</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                  <span>بناء تطبيقات ويب باستخدام الذكاء الاصطناعي</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={handleCompleteMission}
              size="lg"
              variant="default"
              className="flex items-center w-full sm:w-auto"
              dir="rtl"
            >
              <Award className="ml-2 h-5 w-5" />
              <span>اكتملت المهمة</span>
            </Button>

            <Button
              onClick={() => {
                // Call the restart function which will reset to stage 1 but preserve progress
                onRestart();
                // Then navigate back to the mission start
                navigate("/mission1");
              }}
              size="lg"
              variant="outline"
              className="flex items-center w-full sm:w-auto"
              dir="rtl"
            >
              <RefreshCw className="ml-2 h-4 w-4" />
              <span>ابدأ من جديد</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
