import {
  StudentCreateParams,
  StudentModel,
  StudentResponse,
} from "@/models/student.model";
import { setStudentIdCookie, getStudentIdCookie, clearStudentIdCookie } from "@/student-auth/cookies.utils";

export class StudentService {
  static async saveStudentAndSetCookie(
    studentData: StudentCreateParams,
  ): Promise<string> {
    try {
      const response: StudentResponse =
        await StudentModel.createStudent(studentData);

      setStudentIdCookie(response.id);

      return response.id;
    } catch (error) {
      throw error;
    }
  }

  static getStudentIdFromCookie(): string | undefined {
    return getStudentIdCookie();
  }

  static clearStudentCookie(): void {
    clearStudentIdCookie();
  }
}
