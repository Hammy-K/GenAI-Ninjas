export type AuthStep = "email" | "manual";

export type SchoolSelectValue = {
  id: number | "other" | null;
  label: string;
} | null;

export type TrackStudent = {
  studentName?: string;
  school?: string;
  phoneNumber?: string;
};

export type StudentCreatePayload = {
  email?: string;
  fullName: string;
  schoolName: string;
  phoneNumber: string;
};

export type StudentRecord = {
  id: string | number;
  fullName?: string;
  email?: string;
  schoolName?: string;
  phoneNumber?: string;
};
