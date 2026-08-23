import {
  StudentCreateParams,
  StudentModel,
  StudentResponse,
} from "@/models/student.model";
import Cookies from "js-cookie";

export class StudentService {
  static async saveStudentAndSetCookie(
    studentData: StudentCreateParams,
  ): Promise<string> {
    try {
      const response: StudentResponse =
        await StudentModel.createStudent(studentData);

      Cookies.set("studentId", response.id, { expires: 30, path: "/" });

      return response.id;
    } catch (error) {
      throw error;
    }
  }

  static getStudentIdFromCookie(): string | undefined {
    return Cookies.get("studentId");
  }

  static clearStudentCookie(): void {
    Cookies.remove("studentId");
  }
}
