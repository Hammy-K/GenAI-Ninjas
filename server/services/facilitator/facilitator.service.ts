import { readFileSync } from 'fs';
import { join } from 'path';
import type { Facilitator } from '../../../shared/video-flow.schema';

/**
 * Secure facilitator service that maps students to facilitators and API keys
 */

interface FacilitatorConfig {
  facilitator_name: string;
  student_email: string;
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
}

// Singleton instance
export const facilitatorService = new FacilitatorService();