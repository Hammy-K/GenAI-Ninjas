import { db } from "../db";
import { studentHtmlMessages } from "../schemas/student_html_messages";

export async function logStudentHtmlMessage(
  studentId: string,
  message: string,
) {
  if (!studentId || !message) {
    throw new Error("Missing studentId or message");
  }

  return db
    .insert(studentHtmlMessages)
    .values({ studentId, message, createdAt: new Date() });
}
