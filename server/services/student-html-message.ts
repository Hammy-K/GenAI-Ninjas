import { db } from "../db";
import { studentHtmlMessages } from "../schemas/student_html_messages";

export async function logStudentHtmlMessage(
  studentId?: string | null,
  message?: string | null,
) {
  const id = typeof studentId === "string" ? studentId.trim() : "";
  const msg = typeof message === "string" ? message.trim() : "";

  if (!id || !msg) return; // quietly no-op if missing/blank

  return db
    .insert(studentHtmlMessages)
    .values({ studentId: id, message: msg, createdAt: new Date() });
}
