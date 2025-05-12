import { 
  users, 
  quests, 
  projectIdeas,
  galleryImages,
  galleryLikes,
  appBuilderSteps,
  appBuilderProgress,
  appBuilderSubmissions,
  appBuilderChatHistory,
  htmlProjects,
  lovableMissionProgress,
  lovableMissionChatHistory,
  lovableSubmissions,
  type User, 
  type InsertUser, 
  type Quest, 
  type InsertQuest, 
  type ProjectIdea, 
  type InsertProjectIdea,
  type GalleryImage,
  type InsertGalleryImage,
  type GalleryLike,
  type InsertGalleryLike,
  type AppBuilderStep,
  type InsertAppBuilderStep,
  type AppBuilderProgress,
  type InsertAppBuilderProgress,
  type AppBuilderSubmission,
  type InsertAppBuilderSubmission,
  type AppBuilderChatHistory,
  type InsertAppBuilderChatHistory,
  type HtmlProject,
  type InsertHtmlProject,
  type LovableMissionProgress,
  type InsertLovableMissionProgress,
  type LovableMissionChatHistory,
  type InsertLovableMissionChatHistory,
  type LovableSubmission,
  type InsertLovableSubmission
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, lt, gt, asc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quest progress methods
  getQuest(userId: number): Promise<Quest | undefined>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  updateQuest(id: number, data: Partial<InsertQuest>): Promise<Quest | undefined>;
  
  // Project idea methods
  getProjectIdea(id: number): Promise<ProjectIdea | undefined>;
  getProjectIdeasByUser(userId: number): Promise<ProjectIdea[]>;
  createProjectIdea(idea: InsertProjectIdea): Promise<ProjectIdea>;

  // Gallery methods
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  getAllGalleryImages(): Promise<GalleryImage[]>;
  getGalleryImage(id: number): Promise<GalleryImage | undefined>;
  incrementLike(imageId: number, sessionId: string, firebaseUid?: string): Promise<GalleryImage | undefined>;
  decrementLike(imageId: number, sessionId: string, firebaseUid?: string): Promise<GalleryImage | undefined>;
  hasLiked(imageId: number, sessionId: string, firebaseUid?: string): Promise<boolean>;
  
  // App Builder Stream - Steps methods
  getAppBuilderStep(stepNumber: number): Promise<AppBuilderStep | undefined>;
  getAllAppBuilderSteps(): Promise<AppBuilderStep[]>;
  createAppBuilderStep(step: InsertAppBuilderStep): Promise<AppBuilderStep>;
  updateAppBuilderStep(stepNumber: number, data: Partial<InsertAppBuilderStep>): Promise<AppBuilderStep | undefined>;
  
  // App Builder Stream - Progress methods
  getAppBuilderProgressByFirebaseUid(firebaseUid: string): Promise<AppBuilderProgress | undefined>;
  createAppBuilderProgress(progress: InsertAppBuilderProgress): Promise<AppBuilderProgress>;
  updateAppBuilderProgress(id: number, data: Partial<InsertAppBuilderProgress>): Promise<AppBuilderProgress | undefined>;
  
  // App Builder Stream - Submissions methods
  getAppBuilderSubmissionsByProgressId(progressId: number): Promise<AppBuilderSubmission[]>;
  getAppBuilderSubmissionByStepNumber(progressId: number, stepNumber: number): Promise<AppBuilderSubmission | undefined>;
  createAppBuilderSubmission(submission: InsertAppBuilderSubmission): Promise<AppBuilderSubmission>;
  updateAppBuilderSubmission(id: number, data: Partial<InsertAppBuilderSubmission>): Promise<AppBuilderSubmission | undefined>;
  
  // App Builder Stream - Chat History methods
  getAppBuilderChatHistoryByProgressId(progressId: number): Promise<AppBuilderChatHistory[]>;
  getAppBuilderChatHistoryByStep(progressId: number, stepNumber: number): Promise<AppBuilderChatHistory[]>;
  createAppBuilderChatMessage(message: InsertAppBuilderChatHistory): Promise<AppBuilderChatHistory>;
  
  // HTML Project methods
  getHtmlProjectByProjectId(projectId: string): Promise<HtmlProject | undefined>;
  getAllHtmlProjects(): Promise<HtmlProject[]>;
  createHtmlProject(project: InsertHtmlProject): Promise<HtmlProject>;
  updateHtmlProject(projectId: string, html: string): Promise<HtmlProject | undefined>;

  // Lovable Mission methods
  getLovableMissionProgressByFirebaseUid(firebaseUid: string): Promise<LovableMissionProgress | undefined>;
  createLovableMissionProgress(progress: InsertLovableMissionProgress): Promise<LovableMissionProgress>;
  updateLovableMissionProgress(id: number, data: Partial<InsertLovableMissionProgress>): Promise<LovableMissionProgress | undefined>;
  getLovableMissionChatHistoryByProgressId(progressId: number): Promise<LovableMissionChatHistory[]>;
  createLovableMissionChatMessage(message: InsertLovableMissionChatHistory): Promise<LovableMissionChatHistory>;
  
  // Lovable Submissions methods
  createLovableSubmission(submission: InsertLovableSubmission): Promise<LovableSubmission>;
  getLovableSubmissionsByFirebaseUid(firebaseUid: string): Promise<LovableSubmission[]>;
  getLovableSubmissionById(id: number): Promise<LovableSubmission | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Quest progress methods
  async getQuest(userId: number): Promise<Quest | undefined> {
    const [quest] = await db.select().from(quests).where(eq(quests.userId, userId));
    return quest || undefined;
  }
  
  async createQuest(insertQuest: InsertQuest): Promise<Quest> {
    const [quest] = await db
      .insert(quests)
      .values(insertQuest)
      .returning();
    return quest;
  }
  
  async updateQuest(id: number, data: Partial<InsertQuest>): Promise<Quest | undefined> {
    const [updatedQuest] = await db
      .update(quests)
      .set(data)
      .where(eq(quests.id, id))
      .returning();
    return updatedQuest || undefined;
  }
  
  // Project idea methods
  async getProjectIdea(id: number): Promise<ProjectIdea | undefined> {
    const [idea] = await db.select().from(projectIdeas).where(eq(projectIdeas.id, id));
    return idea || undefined;
  }
  
  async getProjectIdeasByUser(userId: number): Promise<ProjectIdea[]> {
    return db.select().from(projectIdeas).where(eq(projectIdeas.userId, userId));
  }
  
  async createProjectIdea(insertIdea: InsertProjectIdea): Promise<ProjectIdea> {
    const [idea] = await db
      .insert(projectIdeas)
      .values(insertIdea)
      .returning();
    return idea;
  }

  // Gallery methods
  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const [galleryImage] = await db
      .insert(galleryImages)
      .values(image)
      .returning();
    return galleryImage;
  }

  async getAllGalleryImages(): Promise<GalleryImage[]> {
    return db.select().from(galleryImages).orderBy(desc(galleryImages.likes));
  }

  async getGalleryImage(id: number): Promise<GalleryImage | undefined> {
    const [image] = await db.select().from(galleryImages).where(eq(galleryImages.id, id));
    return image || undefined;
  }

  async incrementLike(imageId: number, sessionId: string, firebaseUid?: string): Promise<GalleryImage | undefined> {
    // First check if the user has already liked this image
    if (await this.hasLiked(imageId, sessionId, firebaseUid)) {
      // Just return the image without incrementing likes
      return this.getGalleryImage(imageId);
    }

    // Record the like
    await db.insert(galleryLikes).values({
      imageId,
      sessionId,
      firebaseUid: firebaseUid || null // Include Firebase UID if available
    });

    // Increment the likes count using SQL
    const [updatedImage] = await db
      .update(galleryImages)
      .set({
        likes: sql`${galleryImages.likes} + 1`
      })
      .where(eq(galleryImages.id, imageId))
      .returning();

    return updatedImage || undefined;
  }

  async decrementLike(imageId: number, sessionId: string, firebaseUid?: string): Promise<GalleryImage | undefined> {
    // First check if the user has liked this image
    if (!(await this.hasLiked(imageId, sessionId, firebaseUid))) {
      // If not liked, just return the image without changes
      return this.getGalleryImage(imageId);
    }

    // Build the conditions for finding the like
    const conditions = [
      eq(galleryLikes.imageId, imageId),
      eq(galleryLikes.sessionId, sessionId)
    ];
    
    // Add Firebase UID condition if available
    if (firebaseUid) {
      conditions.push(eq(galleryLikes.firebaseUid, firebaseUid));
    }

    // Delete the like record
    await db
      .delete(galleryLikes)
      .where(and(...conditions));

    // Decrement the likes count using SQL, ensuring it doesn't go below 0
    const [updatedImage] = await db
      .update(galleryImages)
      .set({
        likes: sql`GREATEST(${galleryImages.likes} - 1, 0)`
      })
      .where(eq(galleryImages.id, imageId))
      .returning();

    return updatedImage || undefined;
  }

  async hasLiked(imageId: number, sessionId: string, firebaseUid?: string): Promise<boolean> {
    // Build the conditions for finding the like
    const conditions = [
      eq(galleryLikes.imageId, imageId),
      eq(galleryLikes.sessionId, sessionId)
    ];
    
    // Add Firebase UID condition if available
    if (firebaseUid) {
      conditions.push(eq(galleryLikes.firebaseUid, firebaseUid));
    }

    const [like] = await db
      .select()
      .from(galleryLikes)
      .where(and(...conditions));

    return !!like;
  }
  
  // App Builder Stream - Steps methods
  async getAppBuilderStep(stepNumber: number): Promise<AppBuilderStep | undefined> {
    const [step] = await db
      .select()
      .from(appBuilderSteps)
      .where(eq(appBuilderSteps.stepNumber, stepNumber));
    return step || undefined;
  }
  
  async getAllAppBuilderSteps(): Promise<AppBuilderStep[]> {
    return db
      .select()
      .from(appBuilderSteps)
      .orderBy(appBuilderSteps.stepNumber);
  }
  
  async createAppBuilderStep(step: InsertAppBuilderStep): Promise<AppBuilderStep> {
    const [newStep] = await db
      .insert(appBuilderSteps)
      .values(step)
      .returning();
    return newStep;
  }
  
  async updateAppBuilderStep(stepNumber: number, data: Partial<InsertAppBuilderStep>): Promise<AppBuilderStep | undefined> {
    const [updatedStep] = await db
      .update(appBuilderSteps)
      .set({
        ...data,
        updatedAt: new Date() // Always update the timestamp
      })
      .where(eq(appBuilderSteps.stepNumber, stepNumber))
      .returning();
    return updatedStep || undefined;
  }
  
  // App Builder Stream - Progress methods
  async getAppBuilderProgressByFirebaseUid(firebaseUid: string): Promise<AppBuilderProgress | undefined> {
    const [progress] = await db
      .select()
      .from(appBuilderProgress)
      .where(eq(appBuilderProgress.firebaseUid, firebaseUid));
    return progress || undefined;
  }
  
  async createAppBuilderProgress(progress: InsertAppBuilderProgress): Promise<AppBuilderProgress> {
    const [newProgress] = await db
      .insert(appBuilderProgress)
      .values(progress)
      .returning();
    return newProgress;
  }
  
  async updateAppBuilderProgress(id: number, data: Partial<InsertAppBuilderProgress>): Promise<AppBuilderProgress | undefined> {
    const [updatedProgress] = await db
      .update(appBuilderProgress)
      .set({
        ...data,
        updatedAt: new Date() // Always update the timestamp
      })
      .where(eq(appBuilderProgress.id, id))
      .returning();
    return updatedProgress || undefined;
  }
  
  // App Builder Stream - Submissions methods
  async getAppBuilderSubmissionsByProgressId(progressId: number): Promise<AppBuilderSubmission[]> {
    return db
      .select()
      .from(appBuilderSubmissions)
      .where(eq(appBuilderSubmissions.progressId, progressId))
      .orderBy(appBuilderSubmissions.stepNumber, appBuilderSubmissions.version);
  }
  
  async getAppBuilderSubmissionByStepNumber(progressId: number, stepNumber: number): Promise<AppBuilderSubmission | undefined> {
    // Get the most recent version of the submission for this step
    const [submission] = await db
      .select()
      .from(appBuilderSubmissions)
      .where(
        and(
          eq(appBuilderSubmissions.progressId, progressId),
          eq(appBuilderSubmissions.stepNumber, stepNumber)
        )
      )
      .orderBy(desc(appBuilderSubmissions.version))
      .limit(1);
    
    return submission || undefined;
  }
  
  async createAppBuilderSubmission(submission: InsertAppBuilderSubmission): Promise<AppBuilderSubmission> {
    // First check if there are existing submissions for this step and progress
    const existingSubmission = await this.getAppBuilderSubmissionByStepNumber(
      submission.progressId,
      submission.stepNumber
    );
    
    let version = 1;
    if (existingSubmission) {
      // Increment the version if submission exists
      version = existingSubmission.version + 1;
    }
    
    const [newSubmission] = await db
      .insert(appBuilderSubmissions)
      .values({
        ...submission,
        version
      })
      .returning();
    
    return newSubmission;
  }
  
  async updateAppBuilderSubmission(id: number, data: Partial<InsertAppBuilderSubmission>): Promise<AppBuilderSubmission | undefined> {
    const [updatedSubmission] = await db
      .update(appBuilderSubmissions)
      .set({
        ...data,
        updatedAt: new Date() // Always update the timestamp
      })
      .where(eq(appBuilderSubmissions.id, id))
      .returning();
    
    return updatedSubmission || undefined;
  }
  
  // App Builder Stream - Chat History methods
  async getAppBuilderChatHistoryByProgressId(progressId: number): Promise<AppBuilderChatHistory[]> {
    return db
      .select()
      .from(appBuilderChatHistory)
      .where(eq(appBuilderChatHistory.progressId, progressId))
      .orderBy(appBuilderChatHistory.timestamp);
  }
  
  async getAppBuilderChatHistoryByStep(progressId: number, stepNumber: number): Promise<AppBuilderChatHistory[]> {
    return db
      .select()
      .from(appBuilderChatHistory)
      .where(
        and(
          eq(appBuilderChatHistory.progressId, progressId),
          eq(appBuilderChatHistory.stepNumber, stepNumber)
        )
      )
      .orderBy(appBuilderChatHistory.timestamp);
  }
  
  async createAppBuilderChatMessage(message: InsertAppBuilderChatHistory): Promise<AppBuilderChatHistory> {
    const [newMessage] = await db
      .insert(appBuilderChatHistory)
      .values(message)
      .returning();
    
    return newMessage;
  }

  // HTML Project methods
  async getHtmlProjectByProjectId(projectId: string): Promise<HtmlProject | undefined> {
    const [project] = await db
      .select()
      .from(htmlProjects)
      .where(eq(htmlProjects.projectId, projectId));
    
    return project || undefined;
  }
  
  async getAllHtmlProjects(): Promise<HtmlProject[]> {
    return db
      .select()
      .from(htmlProjects)
      .orderBy(desc(htmlProjects.createdAt));
  }
  
  async createHtmlProject(project: InsertHtmlProject): Promise<HtmlProject> {
    const [newProject] = await db
      .insert(htmlProjects)
      .values(project)
      .returning();
    
    return newProject;
  }
  
  async updateHtmlProject(projectId: string, html: string): Promise<HtmlProject | undefined> {
    const [updatedProject] = await db
      .update(htmlProjects)
      .set({
        html,
        updatedAt: new Date()
      })
      .where(eq(htmlProjects.projectId, projectId))
      .returning();
    
    return updatedProject || undefined;
  }

  // Lovable Mission methods
  async getLovableMissionProgressByFirebaseUid(firebaseUid: string): Promise<LovableMissionProgress | undefined> {
    const [progress] = await db
      .select()
      .from(lovableMissionProgress)
      .where(eq(lovableMissionProgress.firebaseUid, firebaseUid));
    
    return progress || undefined;
  }

  async createLovableMissionProgress(progress: InsertLovableMissionProgress): Promise<LovableMissionProgress> {
    const [newProgress] = await db
      .insert(lovableMissionProgress)
      .values(progress)
      .returning();
    
    return newProgress;
  }

  async updateLovableMissionProgress(id: number, data: Partial<InsertLovableMissionProgress>): Promise<LovableMissionProgress | undefined> {
    const [updatedProgress] = await db
      .update(lovableMissionProgress)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(lovableMissionProgress.id, id))
      .returning();
    
    return updatedProgress || undefined;
  }

  async getLovableMissionChatHistoryByProgressId(progressId: number): Promise<LovableMissionChatHistory[]> {
    return db
      .select()
      .from(lovableMissionChatHistory)
      .where(eq(lovableMissionChatHistory.progressId, progressId))
      .orderBy(lovableMissionChatHistory.createdAt);
  }

  async createLovableMissionChatMessage(message: InsertLovableMissionChatHistory): Promise<LovableMissionChatHistory> {
    const [newMessage] = await db
      .insert(lovableMissionChatHistory)
      .values(message)
      .returning();
    
    return newMessage;
  }

  // Lovable Submissions methods implementation
  async createLovableSubmission(submission: InsertLovableSubmission): Promise<LovableSubmission> {
    const [newSubmission] = await db
      .insert(lovableSubmissions)
      .values(submission)
      .returning();
    
    return newSubmission;
  }

  async getLovableSubmissionsByFirebaseUid(firebaseUid: string): Promise<LovableSubmission[]> {
    const submissions = await db
      .select()
      .from(lovableSubmissions)
      .where(eq(lovableSubmissions.firebaseUid, firebaseUid))
      .orderBy(desc(lovableSubmissions.submissionDate));
    
    return submissions;
  }

  async getLovableSubmissionById(id: number): Promise<LovableSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(lovableSubmissions)
      .where(eq(lovableSubmissions.id, id));
    
    return submission || undefined;
  }
}

export const storage = new DatabaseStorage();
