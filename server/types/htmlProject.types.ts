export interface HtmlProject {
  id: number;
  projectId: string;
  html: string;
  firebaseUid: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HtmlProjectWithStudent extends HtmlProject {
  student: {
    id: number;
    fullName: string;
    schoolName: string;
    phoneNumber: string;
    createdAt: Date;
  } | null;
}
