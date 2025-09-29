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

    // Initialize aggregation structure
    const aggregated: AggregatedData = {
      total: 0,
      videoTotal: videoSubs.length,
      lovableTotal: lovableSubs.length,
      uniqueStudents: 0,
      bySupervisor: {},
      bySchool: {},
      byGrade: {},
      byGender: {},
      byProject: {},
    };

    const uniqueEmails = new Set<string>();

    // Helper function to aggregate data
    const addToAggregation = (student: any, projectName: string) => {
      aggregated.total++;

      const studentGender = (student.gender || "Unknown").toLowerCase();

      // Track project counts
      aggregated.byProject[projectName] =
        (aggregated.byProject[projectName] || 0) + 1;

      // Aggregate by supervisor
      const supervisor = student.supervisor || "Unknown";
      if (!aggregated.bySupervisor[supervisor]) {
        aggregated.bySupervisor[supervisor] = {
          total: 0,
          byProject: {},
          byGender: { male: 0, female: 0 },
        };
      }
      aggregated.bySupervisor[supervisor].total++;
      aggregated.bySupervisor[supervisor].byProject[projectName] =
        (aggregated.bySupervisor[supervisor].byProject[projectName] || 0) + 1;
      if (studentGender === "male" || studentGender === "ذكر") {
        aggregated.bySupervisor[supervisor].byGender.male++;
      } else if (studentGender === "female" || studentGender === "أنثى") {
        aggregated.bySupervisor[supervisor].byGender.female++;
      }

      // Aggregate by school
      const school = student.school || "Unknown";
      if (!aggregated.bySchool[school]) {
        aggregated.bySchool[school] = {
          total: 0,
          byProject: {},
          byGender: { male: 0, female: 0 },
        };
      }
      aggregated.bySchool[school].total++;
      aggregated.bySchool[school].byProject[projectName] =
        (aggregated.bySchool[school].byProject[projectName] || 0) + 1;
      if (studentGender === "male" || studentGender === "ذكر") {
        aggregated.bySchool[school].byGender.male++;
      } else if (studentGender === "female" || studentGender === "أنثى") {
        aggregated.bySchool[school].byGender.female++;
      }

      // Aggregate by grade
      const grade = student.grade || "Unknown";
      if (!aggregated.byGrade[grade]) {
        aggregated.byGrade[grade] = {
          total: 0,
          byProject: {},
          byGender: { male: 0, female: 0 },
        };
      }
      aggregated.byGrade[grade].total++;
      aggregated.byGrade[grade].byProject[projectName] =
        (aggregated.byGrade[grade].byProject[projectName] || 0) + 1;
      if (studentGender === "male" || studentGender === "ذكر") {
        aggregated.byGrade[grade].byGender.male++;
      } else if (studentGender === "female" || studentGender === "أنثى") {
        aggregated.byGrade[grade].byGender.female++;
      }

      // Aggregate by gender
      const gender = student.gender || "Unknown";
      if (!aggregated.byGender[gender]) {
        aggregated.byGender[gender] = {
          total: 0,
          byProject: {},
          byGender: { male: 0, female: 0 },
        };
      }
      aggregated.byGender[gender].total++;
      aggregated.byGender[gender].byProject[projectName] =
        (aggregated.byGender[gender].byProject[projectName] || 0) + 1;
    };

    // Process video submissions
    videoSubs.forEach((submission) => {
      const email = submission.email?.toLowerCase();
      if (!email) return;

      uniqueEmails.add(email);
      const student = emailToStudent.get(email);
      if (!student) return;

      const projectName = submission.projectName || "Unknown Project";
      addToAggregation(student, projectName);
    });

    // Process lovable submissions v2
    lovableSubs.forEach((submission) => {
      const email = submission.email?.toLowerCase();
      if (!email) {
        console.log(`Lovable submission has no email, skipping`);
        return;
      }

      uniqueEmails.add(email);
      const student = emailToStudent.get(email);
      if (!student) {
        console.log(`No student found for lovable submission email: ${email}`);
        return;
      }

      const projectName = submission.projectTitle || "Lovable Project";
      addToAggregation(student, projectName);
    });

    aggregated.uniqueStudents = uniqueEmails.size;

    // Get all unique supervisors from students table (even those with 0 submissions)
    const allSupervisors = new Set(
      students.map((s) => s.supervisor || "Unknown"),
    );
    allSupervisors.forEach((supervisor) => {
      if (!aggregated.bySupervisor[supervisor]) {
        // Determine the gender type of students under this supervisor
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
          supervisorGender: "all",
        };
      }
    });

    console.log("Analytics computed successfully");
    console.log(`Total submissions: ${aggregated.total}`);
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
