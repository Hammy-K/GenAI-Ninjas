import React from "react";
import { Button } from "@/components/ui/button";

/**
 * App-wide error boundary. Without one, any uncaught render error white-screens
 * the whole product with no message and no way out. The fallback follows §3.6 /
 * §6: it states what happened in the interface's voice (no apology, no vague
 * "something went wrong") and gives one clear recovery action.
 */

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Keep the technical detail in the console for developers, never on screen.
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground font-tajawal p-6 text-center gap-4"
      >
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-bold">توقّفت الصفحة عن الاستجابة</h1>
          <p className="text-muted-foreground">
            حدث خلل غير متوقّع أثناء عرض هذه الصفحة. حدّث الصفحة للمتابعة من حيث
            توقّفت، وإن استمرّت المشكلة أعد المحاولة بعد قليل.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>تحديث الصفحة</Button>
      </div>
    );
  }
}

export default ErrorBoundary;
