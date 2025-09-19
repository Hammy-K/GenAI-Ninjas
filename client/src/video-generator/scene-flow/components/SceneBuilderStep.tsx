import { useState } from 'react';
import { SceneCard } from './SceneCard';
import { UsageTracker } from './UsageTracker';
import type { Scene } from '@shared/video-flow.schema';

interface SceneBuilderStepProps {
  onComplete: () => void;
}

export function SceneBuilderStep({ onComplete }: SceneBuilderStepProps) {
  const [scenes, setScenes] = useState<Scene[]>([
    { description: '', voiceover: '', aspectRatio: '16:9' },
    { description: '', voiceover: '', aspectRatio: '16:9' },
    { description: '', voiceover: '', aspectRatio: '16:9' },
  ]);

  const [currentScene, setCurrentScene] = useState(0);
  const [completedScenes, setCompletedScenes] = useState<boolean[]>([false, false, false]);

  const updateScene = (index: number, updatedScene: Scene) => {
    const newScenes = [...scenes];
    newScenes[index] = updatedScene;
    setScenes(newScenes);
  };

  const markSceneComplete = (index: number, isComplete: boolean) => {
    const newCompleted = [...completedScenes];
    newCompleted[index] = isComplete;
    setCompletedScenes(newCompleted);

    // Auto-advance to next scene if current scene is completed
    if (isComplete && index === currentScene && index < 2) {
      setCurrentScene(index + 1);
    }
  };

  const allScenesCompleted = completedScenes.every(Boolean);

  const handleComplete = () => {
    if (allScenesCompleted) {
      onComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎬</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          إنشاء المشاهد
        </h2>
        <p className="text-lg text-gray-600">
          أنشئ ثلاثة مشاهد مذهلة لفيديوهاتك
        </p>
      </div>

      {/* Usage Tracker */}
      <UsageTracker className="mb-8" />

      {/* Scene Progress Dots */}
      <div className="flex justify-center items-center space-x-2 space-x-reverse mb-8">
        {scenes.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentScene(index)}
            className={`w-4 h-4 rounded-full transition-colors ${
              completedScenes[index]
                ? 'bg-green-600'
                : index === currentScene
                ? 'bg-blue-600'
                : 'bg-gray-300'
            }`}
            aria-label={`المشهد ${index + 1}`}
            data-testid={`scene-dot-${index + 1}`}
          />
        ))}
      </div>

      {/* Scene Cards */}
      <div className="space-y-4 mb-8">
        {scenes.map((scene, index) => (
          <SceneCard
            key={index}
            sceneNumber={index + 1}
            scene={scene}
            isExpanded={index === currentScene}
            isCompleted={completedScenes[index]}
            isLocked={index > 0 && !completedScenes[index - 1]}
            onUpdate={(updatedScene) => updateScene(index, updatedScene)}
            onComplete={(isComplete) => markSceneComplete(index, isComplete)}
            onExpand={() => setCurrentScene(index)}
            data-testid={`scene-card-${index + 1}`}
          />
        ))}
      </div>

      {/* Complete Button */}
      {allScenesCompleted && (
        <div className="text-center">
          <button
            onClick={handleComplete}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            data-testid="button-complete-scenes"
          >
            🎉 مراجعة جميع الفيديوهات
          </button>
        </div>
      )}
    </div>
  );
}