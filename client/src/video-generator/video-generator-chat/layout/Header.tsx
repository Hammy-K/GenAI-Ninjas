import { ActionsBar } from "./ActionsBar";

export function Header() {
  return (
    <header className="flex items-center justify-between py-3">
      {/* Left side: small Noon title */}
      {/* <div className="text-lg font-bold">Noon Lovable Mission</div> */}

      {/* Center: progress chips */}
      {/* <ProgressChips progress={progress} /> */}

      {/* Right: actions (placeholder for buttons) */}
      <ActionsBar />
    </header>
  );
}
