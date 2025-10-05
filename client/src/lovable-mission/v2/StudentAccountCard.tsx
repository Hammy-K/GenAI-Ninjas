import { ls, storageKeys } from "@/student-auth/storage.utils";

export function StudentAccountCard() {
  const name = ls.get(storageKeys.studentName);
  const school = ls.get(storageKeys.schoolName);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-sm text-gray-500 mb-1">الحساب</div>
      <div className="text-gray-900 font-medium">
        {name ? name : "طالب غير معروف"}
      </div>
      {school && <div className="text-gray-600 text-sm">{school}</div>}

      {/* Uncomment later when you want UI logout:
      <button
        onClick={() => {
          clearAuthSession();
          window.location.reload();
        }}
        className="mt-3 text-xs px-2 py-1 rounded border hover:bg-gray-50"
      >
        تسجيل الخروج
      </button>
      */}
    </div>
  );
}