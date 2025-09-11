import { Button } from "@/components/ui/button";
import { MouseEvent } from "react";
import { Heart } from "lucide-react";

type Props = {
  promptLink?: string;
  onOpen?: () => void;
  className?: string;
};

export function LovableButton({ promptLink, onOpen, className }: Props) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const url = promptLink || "https://lovable.dev";

    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // no-op
    }

    onOpen?.();
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      className={`
        relative inline-flex items-center justify-center gap-2
        px-6 py-3 text-base font-semibold
         shadow-md
        bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600
        hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700
        text-white transition-all duration-200
        ${className ?? ""}
      `}
      title="افتح Lovable"
    >
      <Heart className="h-4 w-4 fill-current" />
      <span>افتح Lovable</span>
    </Button>
  );
}
