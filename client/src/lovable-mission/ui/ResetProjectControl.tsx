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
      className="bg-orange-300 text-black hover:bg-orange-700 hover:text-white w-full"
    >
      <RotateCcw className="w-4 h-4" />
      {label}
    </Button>
  );
}
