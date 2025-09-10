import { ProgressChips } from "./ProgressChips";
import { ActionsBar } from "./ActionsBar";
import type { LovableProgressFlags } from "../types/lovable.types";

interface HeaderProps {
  progress: LovableProgressFlags;
}

export function Header({ progress }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-3 border-b border-gray-200">
      {/* Left side: small Noon title */}
      <div className="text-lg font-bold">Noon Lovable Mission</div>

      {/* Center: progress chips */}
      <ProgressChips progress={progress} />

      {/* Right: actions (placeholder for buttons) */}
      <ActionsBar />
    </header>
  );
}
