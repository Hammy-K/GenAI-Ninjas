import { useAdminAuth } from "@/hooks/auth/useAdminAuth";
import { FormEvent, useState } from "react";
import {
  CustomDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminAuthModal({ open }: { open: boolean }) {
  const { login } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err?.message || "فشل في تسجيل الدخول");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <CustomDialog open={open}>
      <DialogContent className="bg-white w-full md:w-1/3 lg:w-1/4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold text-center">
            🔐 تسجيل دخول المدير
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            الرجاء إدخال بيانات الدخول الخاصة بك
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="username" className="text-right">
              اسم المستخدم
            </Label>

            <Input
              id="username"
              name="username"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white border border-gray-300 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              placeholder="admin"
              required
              disabled={submitting}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-right">
              كلمة المرور
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white border border-gray-300 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              placeholder="••••••••"
              required
              disabled={submitting}
            />
          </div>

          {/* Error (always occupies space to prevent layout shift) */}
          <p
            role="alert"
            aria-live="polite"
            className={`min-h-5 text-center text-sm transition-opacity duration-200 ${
              error ? "text-red-600 opacity-100" : "opacity-0"
            }`}
          >
            {error ?? "placeholder"}
          </p>

          <DialogFooter className="">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </CustomDialog>
  );
}
