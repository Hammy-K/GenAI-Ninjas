import { 
  users, 
  quests, 
  projectIdeas, 
  type User, 
  type InsertUser, 
  type Quest, 
  type InsertQuest, 
  type ProjectIdea, 
  type InsertProjectIdea 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quest progress methods
  getQuest(userId: number): Promise<Quest | undefined>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  updateQuest(id: number, data: Partial<InsertQuest>): Promise<Quest | undefined>;
  
  // Project idea methods
  getProjectIdea(id: number): Promise<ProjectIdea | undefined>;
  getProjectIdeasByUser(userId: number): Promise<ProjectIdea[]>;
  createProjectIdea(idea: InsertProjectIdea): Promise<ProjectIdea>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quests: Map<number, Quest>;
  private projectIdeas: Map<number, ProjectIdea>;
  
  private userIdCounter: number;
  private questIdCounter: number;
  private projectIdeaIdCounter: number;

  constructor() {
    this.users = new Map();
    this.quests = new Map();
    this.projectIdeas = new Map();
    
    this.userIdCounter = 1;
    this.questIdCounter = 1;
    this.projectIdeaIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Quest progress methods
  async getQuest(userId: number): Promise<Quest | undefined> {
    return Array.from(this.quests.values()).find(
      (quest) => quest.userId === userId,
    );
  }
  
  async createQuest(insertQuest: InsertQuest): Promise<Quest> {
    const id = this.questIdCounter++;
    const quest: Quest = { ...insertQuest, id };
    this.quests.set(id, quest);
    return quest;
  }
  
  async updateQuest(id: number, data: Partial<InsertQuest>): Promise<Quest | undefined> {
    const quest = this.quests.get(id);
    if (!quest) return undefined;
    
    const updatedQuest = { ...quest, ...data };
    this.quests.set(id, updatedQuest);
    return updatedQuest;
  }
  
  // Project idea methods
  async getProjectIdea(id: number): Promise<ProjectIdea | undefined> {
    return this.projectIdeas.get(id);
  }
  
  async getProjectIdeasByUser(userId: number): Promise<ProjectIdea[]> {
    return Array.from(this.projectIdeas.values()).filter(
      (idea) => idea.userId === userId,
    );
  }
  
  async createProjectIdea(insertIdea: InsertProjectIdea): Promise<ProjectIdea> {
    const id = this.projectIdeaIdCounter++;
    const idea: ProjectIdea = { ...insertIdea, id };
    this.projectIdeas.set(id, idea);
    return idea;
  }
}

export const storage = new MemStorage();
