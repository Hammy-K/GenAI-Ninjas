import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../../db";
import { videoSubmissions } from "@shared/schema";

// Validation schema for submission
const submitProjectSchema = z.object({
  email: z.string().email("Invalid email format"),
  link: z.string().url("Invalid URL format").min(1, "Link is required"),
  projectName: z.string().min(1, "Project name is required").max(100, "Project name too long"),
});

export async function submitProject(req: Request, res: Response) {
  try {
    // Validate request body
    const validatedData = submitProjectSchema.parse(req.body);

    // Insert into database
    const result = await db.insert(videoSubmissions).values({
      email: validatedData.email,
      link: validatedData.link,
      projectName: validatedData.projectName,
    }).returning();

    res.json({ 
      success: true, 
      message: "Project submitted successfully",
      submissionId: result[0].id 
    });
  } catch (error) {
    console.error("Error submitting project:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to submit project",
    });
  }
}