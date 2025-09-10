import { MouseEvent } from "react";

type Props = {
  promptLink?: string;
  ready: boolean; // isReadyToGoToLovable
  onOpen?: () => void; // call to set buildingOngoing=true, analytics, etc
  className?: string;
};

export function LovableButton({
  promptLink,
  ready,
  onOpen,
  className,
}: Props) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!ready) return;

    const url = promptLink || "https://lovable.dev";
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {}
    onOpen?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!ready}
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        ready
          ? "bg-purple-600 text-white hover:bg-purple-700"
          : "bg-gray-200 text-gray-500 cursor-not-allowed"
      } ${className ?? ""}`}
      title={ready ? "افتح Lovable" : "ليست جاهزة بعد"}
      aria-disabled={!ready}
    >
      افتح Lovable
    </button>
  );
}
