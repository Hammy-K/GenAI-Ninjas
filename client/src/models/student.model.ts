export interface StudentCreateParams {
  fullName: string;
  schoolName: string;
  phoneNumber: string;
}

export interface StudentResponse {
  id: string;
  fullName: string;
  schoolName: string;
  phoneNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

export class StudentModel {
  private static readonly BASE_URL = "/api/students";

  static async createStudent(
    params: StudentCreateParams,
  ): Promise<StudentResponse> {
    const response = await fetch(this.BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      throw new Error(
        errorData.error || `حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى.`,
      );
    }

    const data: StudentResponse = await response.json();

    if (!data.id) {
      throw new Error("لم يتم العثور على معرف الطالب.");
    }

    return data;
  }
}
