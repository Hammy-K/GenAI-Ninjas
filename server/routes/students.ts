import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { students } from "../schemas/students";
import { eq, sql } from "drizzle-orm";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendServerError,
} from "../middleware/response";

export function registerStudentsRoutes(router: Router) {
  const studentsRoutes = Router();

  studentsRoutes.get("/", requireAuth, async (req: Request, res: Response) => {
    try {
      // Parse pagination parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const offset = (page - 1) * limit;

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(students);
      const totalCount = countResult?.count || 0;

      // Fetch paginated students
      const allStudents = await db
        .select()
        .from(students)
        .orderBy(students.id)
        .limit(limit)
        .offset(offset);

      // Return paginated response
      sendSuccess(res, {
        data: allStudents,
        pagination: {
          totalCount,
          currentPage: page,
          pageSize: limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching students:", error);
      sendServerError(res, "Internal server error");
    }
  });

  studentsRoutes.get("/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return sendBadRequest(res, "Invalid ID");
    }

    try {
      const result = await db
        .select()
        .from(students)
        .where(eq(students.id, id))
        .limit(1);
      const student = result[0];

      if (!student) {
        return sendNotFound(res, "Student not found");
      }

      sendSuccess(res, student);
    } catch (error) {
      console.error(`Error fetching student ${id}:`, error);
      sendServerError(res, "Internal server error");
    }
  });

  studentsRoutes.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const { fullName, schoolName, phoneNumber, email } = req.body;

      if (email) {
        const existing = await db
          .select()
          .from(students)
          .where(eq(students.email, email))
          .limit(1);
        if (existing.length > 0) {
          return sendSuccess(res, existing[0]);
        }
      }

      if (!fullName || !schoolName) {
        return sendBadRequest(
          res,
          "fullName and schoolName are required"
        );
      }

      const inserted = await db
        .insert(students)
        .values({
          fullName,
          schoolName,
          phoneNumber: phoneNumber || null,
          email: email || null,
        })
        .returning();

      sendCreated(res, inserted[0]);
    })
  );

  router.use("/students", studentsRoutes);
}
