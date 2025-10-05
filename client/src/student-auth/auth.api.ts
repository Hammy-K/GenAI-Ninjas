import {
  StudentCreatePayload,
  StudentRecord,
  TrackStudent,
} from "./auth.types";

export async function fetchTrackStudentByEmail(
  email: string,
): Promise<TrackStudent | null> {
  const res = await fetch(
    `/api/tracks-students/by-email?email=${encodeURIComponent(email)}`,
  );

  if (!res.ok) return null;

  return res.json();
}

export async function upsertStudent(
  payload: StudentCreatePayload,
): Promise<StudentRecord> {
  const res = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("فشل في إنشاء أو تحديث سجل الطالب");
  }

  return res.json();
}
