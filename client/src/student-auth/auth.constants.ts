// Namespace your keys so different apps/missions don't collide.
// export const AUTH_NS = "noon/auth" as const;

export const AUTH_COOKIE_KEYS = {
  studentId: "studentId",
} as const;

export const AUTH_STORAGE_KEYS = {
  studentId: `studentId`,
  studentName: `studentName`,
  studentGrade: `studentGrade`,
  schoolName: `schoolName`,
  phoneNumber: `phoneNumber`,
  email: `email`,
} as const;

export const AUTH_COOKIE_DEFAULTS = {
  expiresDays: 30, // days
  path: "/",
  secure: true, // set false on http dev if needed
  sameSite: "Lax" as const, // "Lax" is safe default for app flows
};
