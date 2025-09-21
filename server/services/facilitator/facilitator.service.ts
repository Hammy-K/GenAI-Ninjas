import { readFileSync } from 'fs';
import { join } from 'path';
import { eq, and, sql } from 'drizzle-orm';
import type { Facilitator } from '../../../shared/video-flow.schema';
import { db } from '../../db';
import { facilitators, studentFacilitatorAssignments } from '../../../shared/schema';
import { encryptionService } from '../encryption/encryption.service';

/**
 * Secure facilitator service that maps students to facilitators and API keys
 * Supports both database-backed (new) and JSON file-backed (legacy) systems
 */

interface FacilitatorConfig {
  facilitator_name: string;
  student_email: string;
}

export interface VertexAICredentials {
  projectId: string;
  location: string;
  serviceAccountJson: string;
}

export interface FacilitatorInfo {
  id: number;
  name: string;
  isActive: boolean;
}

class FacilitatorService {
  private facilitators: FacilitatorConfig[] = [];
  private readonly API_KEY_MAP: Record<string, string> = {
    'HammyHamz': process.env.FACILITATOR_HAMMYHAMZ_API_KEY || '',
    'Jokerzz': process.env.FACILITATOR_JOKERZZ_API_KEY || '',
    'ThatGuyThatHatesKhalifa': process.env.FACILITATOR_THATGUYTHATHATES_API_KEY || '',
  };

  constructor() {
    this.loadFacilitators();
  }

  private loadFacilitators(): void {
    try {
      const facilitatorsPath = join(process.cwd(), 'facilitators.json');
      const data = readFileSync(facilitatorsPath, 'utf-8');
      this.facilitators = JSON.parse(data);
      console.log(`Loaded ${this.facilitators.length} facilitator configurations`);
    } catch (error) {
      console.error('Failed to load facilitators.json:', error);
      this.facilitators = [];
    }
  }

  /**
   * Get all facilitator names (for dropdown)
   */
  getAllFacilitatorNames(): string[] {
    const uniqueNames = new Set(this.facilitators.map(f => f.facilitator_name));
    return Array.from(uniqueNames);
  }

  /**
   * Find matched facilitator for a student email
   */
  findMatchedFacilitator(studentEmail: string): string | null {
    const match = this.facilitators.find(f => 
      f.student_email.toLowerCase() === studentEmail.toLowerCase()
    );
    return match?.facilitator_name || null;
  }

  /**
   * Get API key for a facilitator (server-side only)
   */
  getFacilitatorApiKey(facilitatorName: string): string | null {
    const apiKey = this.API_KEY_MAP[facilitatorName];
    if (!apiKey) {
      console.error(`No API key found for facilitator: ${facilitatorName}`);
      return null;
    }
    return apiKey;
  }

  /**
   * Validate that a facilitator exists
   */
  isValidFacilitator(facilitatorName: string): boolean {
    return this.getAllFacilitatorNames().includes(facilitatorName);
  }

  /**
   * Get facilitator info without exposing API key
   */
  getFacilitatorInfo(studentEmail: string) {
    return {
      facilitators: this.getAllFacilitatorNames().map(name => ({ name })),
      matchedFacilitatorName: this.findMatchedFacilitator(studentEmail),
    };
  }

  // ===== NEW DATABASE-BACKED METHODS =====

  /**
   * Store facilitator credentials securely in the database
   */
  async storeFacilitatorCredentials(
    name: string,
    credentials: VertexAICredentials,
    isActive: boolean = true
  ): Promise<number> {
    try {
      // Encrypt credentials - include IV in the encrypted string (iv:encryptedData format)
      const encryptedCredentials = encryptionService.encrypt(credentials.serviceAccountJson);
      const encryptedProjectId = encryptionService.encrypt(credentials.projectId);
      const encryptedLocation = encryptionService.encrypt(credentials.location);
      
      // Store in database with encrypted credentials (IV embedded in encrypted string)
      const [facilitator] = await db.insert(facilitators).values({
        name,
        vertexProjectId: `${encryptedProjectId.iv}:${encryptedProjectId.encrypted}`,
        vertexLocation: `${encryptedLocation.iv}:${encryptedLocation.encrypted}`,
        vertexServiceAccountJson: `${encryptedCredentials.iv}:${encryptedCredentials.encrypted}`,
        isActive,
      }).returning();
      
      console.log(`Facilitator credentials stored successfully for: ${name}`);
      return facilitator.id;
    } catch (error) {
      console.error('Failed to store facilitator credentials:', error);
      throw new Error('Failed to store facilitator credentials');
    }
  }

  /**
   * Get facilitator credentials by facilitator ID
   */
  async getFacilitatorCredentials(facilitatorId: number): Promise<VertexAICredentials | null> {
    try {
      const facilitator = await db
        .select()
        .from(facilitators)
        .where(and(eq(facilitators.id, facilitatorId), eq(facilitators.isActive, true)))
        .limit(1);

      if (facilitator.length === 0) {
        return null;
      }

      const facilitatorData = facilitator[0];
      
      // Parse IV and encrypted data from stored format (iv:encryptedData)
      const [projectIdIv, projectIdEncrypted] = facilitatorData.vertexProjectId.split(':');
      const [locationIv, locationEncrypted] = facilitatorData.vertexLocation.split(':');
      const [serviceAccountIv, serviceAccountEncrypted] = facilitatorData.vertexServiceAccountJson.split(':');
      
      const decryptedProjectId = encryptionService.decrypt(projectIdEncrypted, projectIdIv);
      const decryptedLocation = encryptionService.decrypt(locationEncrypted, locationIv);
      const decryptedServiceAccount = encryptionService.decrypt(serviceAccountEncrypted, serviceAccountIv);

      return {
        projectId: decryptedProjectId,
        location: decryptedLocation,
        serviceAccountJson: decryptedServiceAccount,
      };
    } catch (error) {
      console.error('Failed to get facilitator credentials:', error);
      throw new Error('Failed to retrieve facilitator credentials');
    }
  }

  /**
   * Assign a student to a facilitator
   */
  async assignStudentToFacilitator(
    studentEmail: string,
    facilitatorId: number
  ): Promise<void> {
    try {
      await db.insert(studentFacilitatorAssignments).values({
        studentEmail,
        facilitatorId,
      }).onConflictDoUpdate({
        target: [studentFacilitatorAssignments.studentEmail],
        set: {
          facilitatorId,
          assignedAt: new Date(),
        },
      });
      
      console.log(`Student ${studentEmail} assigned to facilitator ${facilitatorId}`);
    } catch (error) {
      console.error('Failed to assign student to facilitator:', error);
      throw new Error('Failed to assign student to facilitator');
    }
  }

  /**
   * Get facilitator credentials for a student (NEW DATABASE METHOD)
   * Returns the assigned facilitator's credentials or fallback to any active facilitator
   */
  async getCredentialsForStudent(studentEmail: string): Promise<VertexAICredentials | null> {
    try {
      // First, try to find assigned facilitator
      const assignment = await db
        .select({
          facilitatorId: studentFacilitatorAssignments.facilitatorId,
        })
        .from(studentFacilitatorAssignments)
        .where(eq(studentFacilitatorAssignments.studentEmail, studentEmail))
        .limit(1);

      if (assignment.length > 0) {
        const credentials = await this.getFacilitatorCredentials(assignment[0].facilitatorId);
        if (credentials) {
          console.log(`Using assigned facilitator for student ${studentEmail}`);
          return credentials;
        }
      }

      // Fallback: get any active facilitator
      const activeFacilitators = await db
        .select()
        .from(facilitators)
        .where(eq(facilitators.isActive, true))
        .limit(1);

      if (activeFacilitators.length === 0) {
        console.log('No active facilitators found');
        return null;
      }

      const fallbackFacilitator = activeFacilitators[0];
      console.log(`Using fallback facilitator ${fallbackFacilitator.name} for student ${studentEmail}`);
      
      // Parse IV and encrypted data from stored format (iv:encryptedData)
      const [projectIdIv, projectIdEncrypted] = fallbackFacilitator.vertexProjectId.split(':');
      const [locationIv, locationEncrypted] = fallbackFacilitator.vertexLocation.split(':');
      const [serviceAccountIv, serviceAccountEncrypted] = fallbackFacilitator.vertexServiceAccountJson.split(':');
      
      const decryptedProjectId = encryptionService.decrypt(projectIdEncrypted, projectIdIv);
      const decryptedLocation = encryptionService.decrypt(locationEncrypted, locationIv);
      const decryptedServiceAccount = encryptionService.decrypt(serviceAccountEncrypted, serviceAccountIv);

      return {
        projectId: decryptedProjectId,
        location: decryptedLocation,
        serviceAccountJson: decryptedServiceAccount,
      };
    } catch (error) {
      console.error('Failed to get credentials for student:', error);
      throw new Error('Failed to get facilitator credentials for student');
    }
  }

  /**
   * Get all active facilitators (for admin UI)
   */
  async getActiveFacilitators(): Promise<FacilitatorInfo[]> {
    try {
      const activeFacilitators = await db
        .select({
          id: facilitators.id,
          name: facilitators.name,
          isActive: facilitators.isActive,
        })
        .from(facilitators)
        .where(eq(facilitators.isActive, true));

      return activeFacilitators;
    } catch (error) {
      console.error('Failed to get active facilitators:', error);
      throw new Error('Failed to get active facilitators');
    }
  }

  /**
   * Bulk assign students to facilitators
   */
  async bulkAssignStudents(assignments: Array<{ studentEmail: string; facilitatorId: number }>): Promise<void> {
    try {
      // Insert all assignments in a single transaction
      await db.insert(studentFacilitatorAssignments).values(
        assignments.map(assignment => ({
          studentEmail: assignment.studentEmail,
          facilitatorId: assignment.facilitatorId,
        }))
      ).onConflictDoUpdate({
        target: [studentFacilitatorAssignments.studentEmail],
        set: {
          facilitatorId: sql`excluded.facilitator_id`,
          assignedAt: new Date(),
        },
      });
      
      console.log(`Bulk assigned ${assignments.length} students to facilitators`);
    } catch (error) {
      console.error('Failed to bulk assign students:', error);
      throw new Error('Failed to bulk assign students');
    }
  }

  // ===== ADMIN METHODS =====

  /**
   * Add a facilitator (wrapper around storeFacilitatorCredentials)
   */
  async addFacilitator(facilitatorData: {
    name: string;
    projectId: string;
    location: string;
    serviceAccountJson: string;
  }): Promise<number> {
    const credentials: VertexAICredentials = {
      projectId: facilitatorData.projectId,
      location: facilitatorData.location,
      serviceAccountJson: facilitatorData.serviceAccountJson,
    };
    
    return await this.storeFacilitatorCredentials(facilitatorData.name, credentials, true);
  }

  /**
   * Get all facilitators (including inactive ones) for admin use
   */
  async getAllFacilitators(): Promise<Array<{
    id: number;
    name: string;
    projectId: string;
    location: string;
    isActive: boolean;
    createdAt: Date;
  }>> {
    try {
      const allFacilitators = await db
        .select({
          id: facilitators.id,
          name: facilitators.name,
          vertexProjectId: facilitators.vertexProjectId,
          vertexLocation: facilitators.vertexLocation,
          isActive: facilitators.isActive,
          createdAt: facilitators.createdAt,
        })
        .from(facilitators);

      // Decrypt project IDs and locations for admin display
      return allFacilitators.map(f => {
        const [projectIdIv, projectIdEncrypted] = f.vertexProjectId.split(':');
        const [locationIv, locationEncrypted] = f.vertexLocation.split(':');
        
        const decryptedProjectId = encryptionService.decrypt(projectIdEncrypted, projectIdIv);
        const decryptedLocation = encryptionService.decrypt(locationEncrypted, locationIv);

        return {
          id: f.id,
          name: f.name,
          projectId: decryptedProjectId,
          location: decryptedLocation,
          isActive: f.isActive,
          createdAt: f.createdAt,
        };
      });
    } catch (error) {
      console.error('Failed to get all facilitators:', error);
      throw new Error('Failed to retrieve all facilitators');
    }
  }

  /**
   * Get all student assignments for admin use
   */
  async getAllStudentAssignments(): Promise<Array<{
    studentEmail: string;
    facilitatorName: string;
    facilitatorId: number;
    assignedAt: Date;
  }>> {
    try {
      const assignments = await db
        .select({
          studentEmail: studentFacilitatorAssignments.studentEmail,
          facilitatorId: studentFacilitatorAssignments.facilitatorId,
          assignedAt: studentFacilitatorAssignments.assignedAt,
          facilitatorName: facilitators.name,
        })
        .from(studentFacilitatorAssignments)
        .innerJoin(facilitators, eq(studentFacilitatorAssignments.facilitatorId, facilitators.id));

      return assignments;
    } catch (error) {
      console.error('Failed to get all student assignments:', error);
      throw new Error('Failed to retrieve student assignments');
    }
  }

  /**
   * Assign a student to a facilitator by facilitator name
   */
  async assignStudentToFacilitatorByName(
    studentEmail: string,
    facilitatorName: string
  ): Promise<void> {
    try {
      // Find facilitator by name
      const facilitator = await db
        .select({ id: facilitators.id })
        .from(facilitators)
        .where(and(eq(facilitators.name, facilitatorName), eq(facilitators.isActive, true)))
        .limit(1);

      if (facilitator.length === 0) {
        throw new Error(`Facilitator "${facilitatorName}" not found or inactive`);
      }

      // Assign using facilitator ID
      await this.assignStudentToFacilitator(studentEmail, facilitator[0].id);
    } catch (error) {
      console.error('Failed to assign student to facilitator by name:', error);
      throw error;
    }
  }

  /**
   * Remove a student assignment
   */
  async removeStudentAssignment(studentEmail: string): Promise<void> {
    try {
      await db
        .delete(studentFacilitatorAssignments)
        .where(eq(studentFacilitatorAssignments.studentEmail, studentEmail));
      
      console.log(`Removed assignment for student: ${studentEmail}`);
    } catch (error) {
      console.error('Failed to remove student assignment:', error);
      throw new Error('Failed to remove student assignment');
    }
  }

  /**
   * Remove a facilitator and all their assignments
   */
  async removeFacilitator(facilitatorName: string): Promise<void> {
    try {
      // Find facilitator by name
      const facilitator = await db
        .select({ id: facilitators.id })
        .from(facilitators)
        .where(eq(facilitators.name, facilitatorName))
        .limit(1);

      if (facilitator.length === 0) {
        throw new Error(`Facilitator "${facilitatorName}" not found`);
      }

      const facilitatorId = facilitator[0].id;

      // Remove all assignments for this facilitator
      await db
        .delete(studentFacilitatorAssignments)
        .where(eq(studentFacilitatorAssignments.facilitatorId, facilitatorId));

      // Remove the facilitator
      await db
        .delete(facilitators)
        .where(eq(facilitators.id, facilitatorId));
      
      console.log(`Removed facilitator: ${facilitatorName} and all associated assignments`);
    } catch (error) {
      console.error('Failed to remove facilitator:', error);
      throw error;
    }
  }
}

// Singleton instance
export const facilitatorService = new FacilitatorService();