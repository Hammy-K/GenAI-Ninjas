import { Router, Request, Response } from "express";
import { db } from "../db";
import { students } from "../schemas/students";
import { eq } from "drizzle-orm";

export function registerStudentsRoutes(router: Router) {
  const studentsRoutes = Router();

  studentsRoutes.get("/", async (_req: Request, res: Response) => {
    try {
      const allStudents = await db.select().from(students).orderBy(students.id);
      res.json(allStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  studentsRoutes.get("/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    try {
      const result = await db
        .select()
        .from(students)
        .where(eq(students.id, id))
        .limit(1);
      const student = result[0];

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json(student);
    } catch (error) {
      console.error(`Error fetching student ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  studentsRoutes.post("/", async (req: Request, res: Response) => {
    const { fullName, schoolName, phoneNumber } = req.body;

    if (!fullName || !schoolName || !phoneNumber) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const inserted = await db
        .insert(students)
        .values({ fullName, schoolName, phoneNumber })
        .returning();

      res.status(201).json(inserted[0]);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.use("/students", studentsRoutes);
}
