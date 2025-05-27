type HtmlProject = {
  id: number;
  projectId: string;
  html: string;
  firebaseUid: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Student = {
  id: string;
  fullName: string;
  schoolName: string;
  phoneNumber: string;
  createdAt: string;
};

export type ProjectWithStudent = HtmlProject & {
  student?: Student;
};
