import { Request, Response } from "express";
import { db } from "../db";
import {
  tracksStudents,
  videoSubmissions,
  lovableSubmissionsV2,
} from "@shared/schema";

interface AggregatedData {
  total: number;
  videoTotal: number;
  lovableTotal: number;
  uniqueStudents: number;
  bySupervisor: Record<string, any>;
  bySchool: Record<string, any>;
  byGrade: Record<string, any>;
  byGender: Record<string, any>;
  byProject: Record<string, number>;
}

// Supervisor maximum submission limits
const SUPERVISOR_MAX_LIMITS: Record<string, number> = {
  "Mohamed Alenzi": 36,
  "أ. باسل العنزي": 22,
  "أ. بدرية القحطاني": 24,
  "أ. تركي الحربي": 38,
  "أ. حسن سعيد": 42,
  "أ. حسين الحمادي": 46,
  "أ. خالد طلق المطيري": 50,
  "أ. خلود السالم": 42,
  "أ. رنا الفوزان": 46,
  "أ. رهف القحطاني": 46,
  "أ. ريان الحسين": 52,
  "أ. ريان الشمراني": 46,
  "أ. سارة الشبانات": 48,
  "أ. سارة القحطاني": 40,
  "أ. سارة سالم القحطاني": 46,
  "أ. سميحة المالكي": 28,
  "أ. صالح العصيمي": 48,
  "أ. عائشة البصري": 22,
  "أ. عبدالرحمن السالمي": 30,
  "أ. عبدالعزيز الحربي": 32,
  "أ. عبدالعزيز الحمودي": 40,
  "أ. عبدالعزيز الفنتوخ": 42,
  "أ. عبدالعزيز الفنيخ": 18,
  "أ. عبدالعزيز عواجي": 48,
  "أ. عبدالقادر العبدالقادر": 34,
  "أ. عبدالله الشمري": 54,
  "أ. عبدالله بن باز": 50,
  "أ. عبدالمجيد الفوزان": 32,
  "أ. علياء العيسى": 48,
  "أ. عيد القحطاني": 38,
  "أ. فتون العتيبي": 42,
  "أ. فيصل القحطاني": 40,
  "أ. لطيفة العيسى": 48,
  "أ. لطيفة الكثيري": 50,
  "أ. محمد الغامدي": 44,
  "أ. محمد بن جدي العتيبي": 36,
  "أ. مرام برغش": 42,
  "أ. مشاري القحطاني": 44,
  "أ. معاذ العصيمي": 44,
  "أ. مها الرازحي": 58,
  "أ. مها الشهراني": 34,
  "أ. ناصر آل مسعود": 14,
  "أ. نواف الشمري": 38,
  "أ. نواف القميع": 28,
  "أ. هاشم مغربي": 44,
  "أ. هند الحربي": 32,
  "أ. هيلة بو سباع": 36,
  "أ. وليد الغامدي": 34,
  "أ. ياسمين بن محياء": 44,
  "ساره ابراهيم عبدالواحد عبدالله": 38,
  "سديم الشهري": 38,
  "عادلة المطيري": 18,
  "وعد البادي": 12,
};

export async function getSubmissionsAnalytics(req: Request, res: Response) {
  try {
    console.log("Fetching submissions analytics...");

    // Fetch all students
    const students = await db.select().from(tracksStudents);
    console.log(`Found ${students.length} students`);

    // Fetch video submissions
    const videoSubs = await db.select().from(videoSubmissions);
    console.log(`Found ${videoSubs.length} video submissions`);

    // Fetch lovable submissions v2
    const lovableSubs = await db.select().from(lovableSubmissionsV2);
    console.log(`Found ${lovableSubs.length} lovable submissions (v2)`);

    // Create email to student mapping
    const emailToStudent = new Map();
    students.forEach((student) => {
      if (student.studentEmail) {
        emailToStudent.set(student.studentEmail.toLowerCase(), student);
      }
    });

    // Track unique emails per project type to enforce one submission per student per type
    const videoEmailsSeen = new Set<string>();
    const lovableEmailsSeen = new Set<string>();

    // Initialize aggregation structure
    const aggregated: AggregatedData = {
      total: 0,
      videoTotal: 0,
      lovableTotal: 0,
      uniqueStudents: 0,
      bySupervisor: {},
      bySchool: {},
      byGrade: {},
      byGender: {},
      byProject: {},
    };

    const uniqueEmails = new Set<string>();

    // Helper function to aggregate data
    const addToAggregation = (
      student: any,
      projectName: string,
      submissionSource: "video" | "lovable",
    ) => {
      aggregated.total++;

      // Track project counts
      aggregated.byProject[projectName] =
        (aggregated.byProject[projectName] || 0) + 1;

      // Aggregate by supervisor
      const supervisor = student.supervisor || "Unknown";
      if (!aggregated.bySupervisor[supervisor]) {
        const supervisorStudents = students.filter(
          (s) => (s.supervisor || "Unknown") === supervisor,
        );
        const genders = supervisorStudents.map((s) =>
          (s.gender || "").toLowerCase(),
        );
        const hasMale = genders.some((g) => g === "male" || g === "ذكر");
        const hasFemale = genders.some((g) => g === "female" || g === "أنثى");

        aggregated.bySupervisor[supervisor] = {
          total: 0,
          byProject: {},
          videoCount: 0,
          lovableCount: 0,
          maxLimit: SUPERVISOR_MAX_LIMITS[supervisor] || 0,
          supervisorGender: hasMale ? "male" : hasFemale ? "female" : "unknown",
        };
      }
      aggregated.bySupervisor[supervisor].total++;
      aggregated.bySupervisor[supervisor].byProject[projectName] =
        (aggregated.bySupervisor[supervisor].byProject[projectName] || 0) + 1;
      if (submissionSource === "video") {
        aggregated.bySupervisor[supervisor].videoCount++;
      } else {
        aggregated.bySupervisor[supervisor].lovableCount++;
      }

      // Aggregate by school
      const school = student.school || "Unknown";
      if (!aggregated.bySchool[school]) {
        const schoolStudents = students.filter(
          (s) => (s.school || "Unknown") === school,
        );
        const genders = schoolStudents.map((s) =>
          (s.gender || "").toLowerCase(),
        );
        const hasMale = genders.some((g) => g === "male" || g === "ذكر");
        const hasFemale = genders.some((g) => g === "female" || g === "أنثى");

        aggregated.bySchool[school] = {
          total: 0,
          byProject: {},
          videoCount: 0,
          lovableCount: 0,
          maxLimit: 0,
          supervisorGender: hasMale ? "male" : hasFemale ? "female" : "unknown",
        };
      }
      aggregated.bySchool[school].total++;
      aggregated.bySchool[school].byProject[projectName] =
        (aggregated.bySchool[school].byProject[projectName] || 0) + 1;
      if (submissionSource === "video") {
        aggregated.bySchool[school].videoCount++;
      } else {
        aggregated.bySchool[school].lovableCount++;
      }

      // Aggregate by grade
      const grade = student.grade || "Unknown";
      if (!aggregated.byGrade[grade]) {
        const gradeStudents = students.filter(
          (s) => (s.grade || "Unknown") === grade,
        );
        const genders = gradeStudents.map((s) =>
          (s.gender || "").toLowerCase(),
        );
        const hasMale = genders.some((g) => g === "male" || g === "ذكر");
        const hasFemale = genders.some((g) => g === "female" || g === "أنثى");

        aggregated.byGrade[grade] = {
          total: 0,
          byProject: {},
          videoCount: 0,
          lovableCount: 0,
          maxLimit: 0,
          supervisorGender: hasMale ? "male" : hasFemale ? "female" : "unknown",
        };
      }
      aggregated.byGrade[grade].total++;
      aggregated.byGrade[grade].byProject[projectName] =
        (aggregated.byGrade[grade].byProject[projectName] || 0) + 1;
      if (submissionSource === "video") {
        aggregated.byGrade[grade].videoCount++;
      } else {
        aggregated.byGrade[grade].lovableCount++;
      }

      // Aggregate by gender
      const gender = student.gender || "Unknown";
      if (!aggregated.byGender[gender]) {
        aggregated.byGender[gender] = {
          total: 0,
          byProject: {},
          videoCount: 0,
          lovableCount: 0,
          maxLimit: 0,
          supervisorGender: "all",
        };
      }
      aggregated.byGender[gender].total++;
      aggregated.byGender[gender].byProject[projectName] =
        (aggregated.byGender[gender].byProject[projectName] || 0) + 1;
      if (submissionSource === "video") {
        aggregated.byGender[gender].videoCount++;
      } else {
        aggregated.byGender[gender].lovableCount++;
      }
    };

    // Process video submissions - only count first submission per email
    videoSubs.forEach((submission) => {
      const email = submission.email?.toLowerCase();
      if (!email) return;

      // Skip if this email already submitted a video
      if (videoEmailsSeen.has(email)) {
        console.log(`Duplicate video submission skipped for email: ${email}`);
        return;
      }

      videoEmailsSeen.add(email);
      uniqueEmails.add(email);

      const student = emailToStudent.get(email);
      if (!student) {
        console.log(`No student found for video submission email: ${email}`);
        return;
      }

      const projectName = submission.projectName || "Unknown Project";
      addToAggregation(student, projectName, "video");
      aggregated.videoTotal++;
    });

    // Process lovable submissions v2 - only count first submission per email
    lovableSubs.forEach((submission) => {
      const email = submission.email?.toLowerCase();
      if (!email) {
        console.log(`Lovable submission has no email, skipping`);
        return;
      }

      // Skip if this email already submitted a lovable project
      if (lovableEmailsSeen.has(email)) {
        console.log(`Duplicate lovable submission skipped for email: ${email}`);
        return;
      }

      lovableEmailsSeen.add(email);
      uniqueEmails.add(email);

      const student = emailToStudent.get(email);
      if (!student) {
        console.log(`No student found for lovable submission email: ${email}`);
        return;
      }

      const projectName = submission.projectTitle || "Lovable Project";
      addToAggregation(student, projectName, "lovable");
      aggregated.lovableTotal++;
    });

    aggregated.uniqueStudents = uniqueEmails.size;

    // Get all unique supervisors from students table (even those with 0 submissions)
    const allSupervisors = new Set(
      students.map((s) => s.supervisor || "Unknown"),
    );
    allSupervisors.forEach((supervisor) => {
      if (!aggregated.bySupervisor[supervisor]) {
        const supervisorStudents = students.filter(
          (s) => (s.supervisor || "Unknown") === supervisor,
        );
        const genders = supervisorStudents.map((s) =>
          (s.gender || "").toLowerCase(),
        );
        const hasMale = genders.some((g) => g === "male" || g === "ذكر");
        const hasFemale = genders.some((g) => g === "female" || g === "أنثى");

        aggregated.bySupervisor[supervisor] = {
          total: 0,
          byProject: {},
          videoCount: 0,
          lovableCount: 0,
          maxLimit: SUPERVISOR_MAX_LIMITS[supervisor] || 0,
          supervisorGender: hasMale ? "male" : hasFemale ? "female" : "unknown",
        };
      }
    });

    // Get all unique schools
    const allSchools = new Set(students.map((s) => s.school || "Unknown"));
    allSchools.forEach((school) => {
      if (!aggregated.bySchool[school]) {
        const schoolStudents = students.filter(
          (s) => (s.school || "Unknown") === school,
        );
        const genders = schoolStudents.map((s) =>
          (s.gender || "").toLowerCase(),
        );
        const hasMale = genders.some((g) => g === "male" || g === "ذكر");
        const hasFemale = genders.some((g) => g === "female" || g === "أنثى");

        aggregated.bySchool[school] = {
          total: 0,
          byProject: {},
          videoCount: 0,
          lovableCount: 0,
          maxLimit: 0,
          supervisorGender: hasMale ? "male" : hasFemale ? "female" : "unknown",
        };
      }
    });

    // Get all unique grades
    const allGrades = new Set(students.map((s) => s.grade || "Unknown"));
    allGrades.forEach((grade) => {
      if (!aggregated.byGrade[grade]) {
        const gradeStudents = students.filter(
          (s) => (s.grade || "Unknown") === grade,
        );
        const genders = gradeStudents.map((s) =>
          (s.gender || "").toLowerCase(),
        );
        const hasMale = genders.some((g) => g === "male" || g === "ذكر");
        const hasFemale = genders.some((g) => g === "female" || g === "أنثى");

        aggregated.byGrade[grade] = {
          total: 0,
          byProject: {},
          videoCount: 0,
          lovableCount: 0,
          maxLimit: 0,
          supervisorGender: hasMale ? "male" : hasFemale ? "female" : "unknown",
        };
      }
    });

    // Get all unique genders
    const allGenders = new Set(students.map((s) => s.gender || "Unknown"));
    allGenders.forEach((gender) => {
      if (!aggregated.byGender[gender]) {
        aggregated.byGender[gender] = {
          total: 0,
          byProject: {},
          videoCount: 0,
          lovableCount: 0,
          maxLimit: 0,
          supervisorGender: "all",
        };
      }
    });

    console.log("Analytics computed successfully");
    console.log(`Total submissions: ${aggregated.total}`);
    console.log(`Video submissions (unique): ${aggregated.videoTotal}`);
    console.log(`Lovable submissions (unique): ${aggregated.lovableTotal}`);
    console.log(`Unique students: ${aggregated.uniqueStudents}`);

    res.json(aggregated);
  } catch (error) {
    console.error("Error fetching submissions analytics:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    res.status(500).json({
      error: "Failed to fetch submissions analytics",
      details: errorMessage,
    });
  }
}
