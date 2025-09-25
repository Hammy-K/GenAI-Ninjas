import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useLovableAuth } from "../auth/AuthProvider";
import { toastError } from "../ui/Toast";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
// className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
type Props = {
  className?: string;
  googleIconSrc?: string; // e.g., "/icons/google.svg"
};

export function AccountCard({ className = "", googleIconSrc }: Props) {
  const { user, signIn, isSigningIn, signOut } = useLovableAuth();

  const handleSignIn = useCallback(async () => {
    try {
      await signIn();
    } catch {
      toastError("حدث خطأ أثناء تسجيل الدخول.");
    }
  }, [signIn]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch {
      // no-op: signOut already handles local cleanup
    }
  }, [signOut]);

  return (
    <section
      aria-labelledby="account-title"
      className={`pt-4 border-t border-gray-100 ${className}`}
    >
      {/* <h2
        id="account-title"
        className="text-sm font-semibold text-gray-900 mb-2 text-center"
      >
        حسابك
      </h2> */}

      {user ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <img
            src={
              user.photoURL ||
              "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(user.displayName)
            }
            alt={user.displayName}
            className="w-12 h-12 rounded-full object-cover"
          />

          <div className="min-w-0 text-center">
            <div className="text-sm font-semibold truncate">
              {user.displayName}
            </div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>

          <Button
            type="button"
            onClick={handleSignOut}
            variant="outline"
            className={cn(
              "w-full",
              "border-red-500 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500",
            )}
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSignIn}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 shadow-sm hover:shadow transition bg-white"
        >
          {googleIconSrc ? (
            <img src={googleIconSrc} alt="" className="w-4 h-4" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isSigningIn ? "جاري تسجيل الدخول..." : "متابعة باستخدام Google"}
          </span>
        </button>
      )}
    </section>
  );
}
