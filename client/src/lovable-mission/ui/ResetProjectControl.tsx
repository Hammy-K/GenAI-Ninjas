import { Button } from "@/components/ui/button";
import { toastSuccess, toastError } from "./Toast";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onReset: () => Promise<void> | void;
  label?: string;
};

export function ResetProjectControl({ onReset, label = "إعادة البدء" }: Props) {
  const handleClick = async () => {
    try {
      await Promise.resolve(onReset());
      toastSuccess("تم بدء مشروع جديد بنجاح");
    } catch (e) {
      toastError("فشل في إعادة التعيين");
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant="outline"
      className={cn(
        "w-full",
        // Override the outline variant's default purple colors with red
        "border-red-500 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500",
      )}
    >
      <RotateCcw />
      {label}
    </Button>
  );
}
