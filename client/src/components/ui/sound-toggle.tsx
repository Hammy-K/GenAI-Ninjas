import { Volume2, VolumeX } from "lucide-react";
import { useSoundSetting } from "@/hooks/useSoundSetting";

/**
 * The persisted sound on/off control (§5, §9: sound is individually disableable).
 * The icon reflects the current state; the choice is remembered across reloads.
 */
export function SoundToggle({ className }: { className?: string }) {
  const { soundEnabled, toggleSound } = useSoundSetting();
  const label = soundEnabled ? "إيقاف الصوت" : "تشغيل الصوت";

  return (
    <button
      type="button"
      onClick={toggleSound}
      className={className}
      title={label}
      aria-label={label}
      aria-pressed={soundEnabled}
    >
      {soundEnabled ? (
        <Volume2 className="h-6 w-6" />
      ) : (
        <VolumeX className="h-6 w-6" />
      )}
    </button>
  );
}

export default SoundToggle;
