import { toast } from "@/hooks/use-toast";

export function toastSuccess(message: string) {
  toast({ description: message, variant: "default" });
}

export function toastError(message: string) {
  toast({ description: message, variant: "destructive" });
}

export function toastInfo(message: string) {
  toast({ description: message, variant: "default" });
}
