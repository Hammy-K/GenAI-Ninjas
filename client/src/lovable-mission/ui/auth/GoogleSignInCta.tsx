import { useLovableAuth } from "@/lovable-mission/auth/AuthProvider";
import { toastError } from "../Toast";

export function GoogleSignInCTA() {
  const { signIn, isSigningIn } = useLovableAuth();

  const handleClick = async () => {
    try {
      await signIn();
    } catch {
      toastError("حدث خطأ أثناء تسجيل الدخول.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-2">مرحباً 👋</h1>
      <p className="text-gray-600 mb-6">
        لتجربة مهمة Lovable وحفظ مشروعك في المعرض، سجّل الدخول بحساب Google.
      </p>

      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-3 px-5 py-3 rounded-lg border border-gray-300 shadow-sm hover:shadow transition bg-white"
      >
        {/* Google “G” icon (SVG) */}
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.4 0 19-8.4 19-19 0-1.3-.1-2.2-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.6 16.6 18.9 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 36 26.8 37 24 37c-5.3 0-9.7-3.1-11.6-7.5l-6.6 5C8.4 39.6 15.7 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.3-3.6 5.9-6.7 7.4l6.3 5.2C38.1 37.8 43 31.7 43.6 20.5z"
          />
        </svg>
        <span className="font-medium">
          {isSigningIn ? "جاري تسجيل الدخول..." : "متابعة باستخدام Google"}
        </span>
      </button>

      <p className="text-xs text-gray-500 mt-3">
        سنستخدم اسمك وبريدك فقط لحفظ مشروعك.
      </p>
    </div>
  );
}
