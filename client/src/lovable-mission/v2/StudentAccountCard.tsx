import { clearAuthSession } from "@/student-auth/session.utils";
import { ls, storageKeys } from "@/student-auth/storage.utils";

export function StudentAccountCard() {
  const name = ls.get(storageKeys.studentName);
  const school = ls.get(storageKeys.schoolName);

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
        onClick={() => {
          clearAuthSession();
          window.location.reload();
        }}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 shadow-sm hover:shadow transition bg-white"
      >
        تسجيل الخروج
      </button>
    </div>
  );
}
