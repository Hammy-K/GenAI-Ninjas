import { Button } from "@/components/ui/button";
import { toastSuccess, toastError } from "./Toast";
import { RotateCcw } from "lucide-react";

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
      className="border-2 border-red-500 bg-white text-red-600 hover:bg-red-500 hover:text-white w-full"
    >
      <RotateCcw className="w-4 h-4" />
      {label}
    </Button>
  );
}
