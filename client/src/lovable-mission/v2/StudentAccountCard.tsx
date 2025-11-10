import { useEffect, useState } from "react";
import { clearAuthSession } from "@/student-auth/session.utils";
import { ls, storageKeys } from "@/student-auth/storage.utils";

function forceLogoutAndReload() {
  clearAuthSession();
  window.location.reload();
}

export function StudentAccountCard() {
  const [name, setName] = useState(() => ls.get(storageKeys.studentName));
  const [school, setSchool] = useState(() => ls.get(storageKeys.schoolName));
  const [countdown, setCountdown] = useState(120); // seconds

  useEffect(() => {
    // poll every 1s, max 10 seconds
    const timer = setInterval(() => {
      const newName = ls.get(storageKeys.studentName);
      const newSchool = ls.get(storageKeys.schoolName);

      // Update if changed
      if (newName !== name) setName(newName);
      if (newSchool !== school) setSchool(newSchool);

      setCountdown((prev) => {
        const next = prev - 1;

        // If we got the name, stop polling early
        if (newName && newName.trim().length > 0) {
          clearInterval(timer);
          return next; // value here doesn't matter anymore
        }

        // If timer hit 0 and still no name, force logout & reload
        if (next <= 0) {
          clearInterval(timer);
          // forceLogoutAndReload();
        }
        return next;
      });
    }, 1000);

    // immediate first read (before first 1s tick)
    const initialName = ls.get(storageKeys.studentName);
    const initialSchool = ls.get(storageKeys.schoolName);

    if (initialName !== name) setName(initialName);
    if (initialSchool !== school) setSchool(initialSchool);

    if (initialName && initialName.trim().length > 0) {
      clearInterval(timer); // already logged in, no need to poll
      setCountdown(10);
    }

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  return (
    <div className="bg-white pt-2 border-t border-gray-100">
      <div className="text-gray-900 font-medium text-center my-1">
        {name ? name : "طالب غير معروف"}
      </div>

      {school && (
        <div className="text-gray-600 text-sm text-center my-2">{school}</div>
      )}

      <button
        type="button"
        onClick={forceLogoutAndReload}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 shadow-sm hover:shadow transition bg-white"
      >
        تسجيل الخروج
      </button>
    </div>
  );
}
