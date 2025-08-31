import { useEffect, useRef } from "react";
import Cookies from "js-cookie";

export default function ClientReset() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    try {
      localStorage.clear();
      Cookies.remove("studentId");
    } finally {
      // single hard redirect; no navigate()
      window.location.replace("/");
      // DO NOT call window.location.reload() here
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <div className="w-10 h-10 border-4 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
    </div>
  );
}
