import { useState } from "react";
import { SceneCard } from "./SceneCard";
import { UsageTracker } from "./UsageTracker";
import { Button } from "@/components/ui/button";
import { Film, CheckCircle, ArrowRight } from "lucide-react";
import type { Scene } from "@shared/video-flow.schema";

interface SceneBuilderStepProps {
  onComplete: () => void;
}

export function SceneBuilderStep({ onComplete }: SceneBuilderStepProps) {
  const [scenes, setScenes] = useState<Scene[]>([
    { description: "", voiceover: "", aspectRatio: "16:9" },
    { description: "", voiceover: "", aspectRatio: "16:9" },
    { description: "", voiceover: "", aspectRatio: "16:9" },
  ]);
  const [currentScene, setCurrentScene] = useState(0);
  const [completedScenes, setCompletedScenes] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

  const updateScene = (index: number, updatedScene: Scene) => {
    const newScenes = [...scenes];
    newScenes[index] = updatedScene;
    setScenes(newScenes);
  };

  const markSceneComplete = (index: number, isComplete: boolean) => {
    const newCompleted = [...completedScenes];
    newCompleted[index] = isComplete;
    setCompletedScenes(newCompleted);
    // No auto-advancement - complete freedom to navigate
  };

  const allScenesCompleted = completedScenes.every(Boolean);
  const completedCount = completedScenes.filter(Boolean).length;

  const handleComplete = () => {
    if (allScenesCompleted) {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Compact Header with Usage Tracker */}
        <div className="flex items-center justify-between mb-6 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">أنشئ مشاهدك</h2>
              <p className="text-sm text-gray-600">
                {completedCount} من 3 مكتمل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <UsageTracker className="border-0 bg-transparent shadow-none p-0" />

            {/* FREE NAVIGATION: Click any scene anytime */}
            <div className="flex gap-2">
              {scenes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentScene(index)}
                  className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center text-xs font-bold ${
                    completedScenes[index]
                      ? "bg-green-500 text-white shadow-md hover:bg-green-600 cursor-pointer"
                      : index === currentScene
                        ? "bg-purple-500 text-white shadow-md scale-110"
                        : "bg-gray-200 text-gray-500 hover:bg-gray-300 cursor-pointer"
                  }`}
                  data-testid={`scene-dot-${index + 1}`}
                  title={`انتقل إلى المشهد ${index + 1}`}
                >
                  {completedScenes[index] ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Scene Cards - NO RESTRICTIONS */}
          {scenes.map((scene, index) => (
            <div key={index} className="h-fit">
              <SceneCard
                sceneNumber={index + 1}
                scene={scene}
                isExpanded={index === currentScene}
                isCompleted={completedScenes[index]}
                isLocked={false} // REMOVED: No more locking - complete freedom
                onUpdate={(updatedScene) => updateScene(index, updatedScene)}
                onComplete={(isComplete) =>
                  markSceneComplete(index, isComplete)
                }
                onExpand={() => setCurrentScene(index)}
                data-testid={`scene-card-${index + 1}`}
              />
            </div>
          ))}
        </div>

        {/* Compact Completion Section */}
        {allScenesCompleted && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center shadow-lg">
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold text-green-800">
                  جميع المشاهد جاهزة!
                </h3>
                <p className="text-sm text-green-700">
                  يمكنك الآن مراجعة الفيديوهات
                </p>
              </div>
              <Button
                onClick={handleComplete}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg"
                data-testid="button-complete-scenes"
              >
                <div className="flex items-center gap-2">
                  <span>مراجعة</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* Compact Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 rounded-full"
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
