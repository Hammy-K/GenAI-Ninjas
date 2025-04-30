import { 
  users, 
  quests, 
  projectIdeas,
  galleryImages,
  galleryLikes,
  type User, 
  type InsertUser, 
  type Quest, 
  type InsertQuest, 
  type ProjectIdea, 
  type InsertProjectIdea,
  type GalleryImage,
  type InsertGalleryImage,
  type GalleryLike,
  type InsertGalleryLike
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
