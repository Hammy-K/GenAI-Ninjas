export type SubmissionPayload = {
  studentName?: string;
  email?: string;
  projectTitle?: string;
  projectLink?: string;
};

export type ValidationResult =
  | { ok: true; data: Required<SubmissionPayload> }
  | { ok: false; userMessage: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidProjectLink(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const https = url.protocol === "https:";
    const allowed =
      urlStr.startsWith("https://lovable.dev/projects") ||
      urlStr.includes("lovable.app");
    return https && allowed;
  } catch {
    return false;
  }
}

export function validateSubmissionPayload(
  p: SubmissionPayload,
): ValidationResult {
  const studentName = (p.studentName ?? "").trim();
  const email = (p.email ?? "").trim().toLowerCase();
  const projectTitle = (p.projectTitle ?? "").trim();
  const projectLink = (p.projectLink ?? "").trim();

  if (!studentName) {
    return { ok: false, userMessage: "الاسم مطلوب. الرجاء إدخال اسم الطالب." };
  }

  if (!email) {
    return {
      ok: false,
      userMessage: "البريد الإلكتروني مطلوب. الرجاء تسجيل الدخول بحساب Google.",
    };
  }
  if (!EMAIL_RE.test(email)) {
    return {
      ok: false,
      userMessage: "البريد الإلكتروني غير صالح. الرجاء التأكد من صحة البريد.",
    };
  }

  if (!projectTitle) {
    return { ok: false, userMessage: "عنوان المشروع مطلوب." };
  }

  if (!projectLink) {
    return { ok: false, userMessage: "رابط المشروع مطلوب." };
  }
  if (!isValidProjectLink(projectLink)) {
    return {
      ok: false,
      userMessage:
        "الرجاء إدخال رابط صالح من Lovable يبدأ بـ https://lovable.dev/projects أو يحتوي على lovable.app",
    };
  }

  return {
    ok: true,
    data: { studentName, email, projectTitle, projectLink },
  };
}
