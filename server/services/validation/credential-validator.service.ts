import { GoogleAuth } from 'google-auth-library';
import { facilitatorService } from '../facilitator/facilitator.service';

interface VertexAICredentials {
  projectId: string;
  location: string;
  serviceAccountJson: string;
}

export interface ValidationResult {
  facilitatorId: number;
  facilitatorName: string;
  isValid: boolean;
  errorType?: 'parse_error' | 'token_error_invalid_grant' | 'project_mismatch' | 'location_missing' | 'network_error' | 'unknown_error';
  errorMessage?: string;
  validatedAt: Date;
}

export interface ValidationReport {
  totalFacilitators: number;
  validCount: number;
  invalidCount: number;
  results: ValidationResult[];
  generatedAt: Date;
}

class CredentialValidatorService {
  private lastReport: ValidationReport | null = null;

  /**
   * Validate a single facilitator's credentials
   */
  async validateFacilitator(facilitatorId: number, facilitatorName: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      facilitatorId,
      facilitatorName,
      isValid: false,
      validatedAt: new Date(),
    };

    try {
      // Get encrypted credentials from database
      const credentials = await facilitatorService.getFacilitatorCredentials(facilitatorId);
      
      if (!credentials) {
        result.errorType = 'parse_error';
        result.errorMessage = 'No credentials found for facilitator';
        return result;
      }

      // Parse and validate service account JSON structure
      let serviceAccountJson;
      try {
        serviceAccountJson = JSON.parse(credentials.serviceAccountJson);
      } catch (error) {
        result.errorType = 'parse_error';
        result.errorMessage = 'Invalid JSON format in service account';
        return result;
      }

      // Check required fields
      const requiredFields = ['type', 'project_id', 'client_email', 'private_key', 'token_uri'];
      for (const field of requiredFields) {
        if (!serviceAccountJson[field]) {
          result.errorType = 'parse_error';
          result.errorMessage = `Missing required field: ${field}`;
          return result;
        }
      }

      // Validate project_id matches
      if (serviceAccountJson.project_id !== credentials.projectId) {
        result.errorType = 'project_mismatch';
        result.errorMessage = `Service account project_id (${serviceAccountJson.project_id}) doesn't match facilitator project_id (${credentials.projectId})`;
        return result;
      }

      // Validate location is present
      if (!credentials.location || credentials.location.trim() === '') {
        result.errorType = 'location_missing';
        result.errorMessage = 'Location field is empty';
        return result;
      }

      // Test actual Google Auth token acquisition
      try {
        const auth = new GoogleAuth({
          credentials: serviceAccountJson,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        const client = await auth.getClient();
        await client.getAccessToken();

        // If we get here, the credentials are valid
        result.isValid = true;
        return result;

      } catch (authError: any) {
        // Classify the authentication error
        if (authError.message?.includes('invalid_grant') || authError.code === 400) {
          result.errorType = 'token_error_invalid_grant';
          result.errorMessage = 'Invalid JWT signature or expired service account key';
        } else if (authError.code === 'NETWORK_ERROR' || authError.code === 'ENOTFOUND') {
          result.errorType = 'network_error';
          result.errorMessage = 'Network error during token acquisition';
        } else {
          result.errorType = 'unknown_error';
          result.errorMessage = `Authentication failed: ${authError.message}`;
        }
        return result;
      }

    } catch (error: any) {
      result.errorType = 'unknown_error';
      result.errorMessage = `Unexpected error: ${error.message}`;
      return result;
    }
  }

  /**
   * Validate all active facilitators (with concurrency limit)
   */
  async validateAllFacilitators(): Promise<ValidationReport> {
    console.log('🔍 Starting validation of all facilitator credentials...');
    
    try {
      const activeFacilitators = await facilitatorService.getActiveFacilitators();
      console.log(`Found ${activeFacilitators.length} active facilitators to validate`);

      const results: ValidationResult[] = [];
      const CONCURRENCY_LIMIT = 5; // Don't overwhelm the Google Auth API

      // Process facilitators in batches
      for (let i = 0; i < activeFacilitators.length; i += CONCURRENCY_LIMIT) {
        const batch = activeFacilitators.slice(i, i + CONCURRENCY_LIMIT);
        console.log(`Validating batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}/${Math.ceil(activeFacilitators.length / CONCURRENCY_LIMIT)} (${batch.length} facilitators)`);

        const batchPromises = batch.map(facilitator =>
          this.validateFacilitator(facilitator.id, facilitator.name)
            .catch(error => ({
              facilitatorId: facilitator.id,
              facilitatorName: facilitator.name,
              isValid: false,
              errorType: 'unknown_error' as const,
              errorMessage: `Validation failed: ${error.message}`,
              validatedAt: new Date(),
            }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to be nice to the API
        if (i + CONCURRENCY_LIMIT < activeFacilitators.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const report: ValidationReport = {
        totalFacilitators: results.length,
        validCount: results.filter(r => r.isValid).length,
        invalidCount: results.filter(r => !r.isValid).length,
        results,
        generatedAt: new Date(),
      };

      // Cache the report
      this.lastReport = report;
      
      console.log(`✅ Validation complete: ${report.validCount}/${report.totalFacilitators} facilitators valid`);
      if (report.invalidCount > 0) {
        console.log('❌ Invalid facilitators:');
        report.results
          .filter(r => !r.isValid)
          .forEach(r => console.log(`  - ${r.facilitatorName} (ID: ${r.facilitatorId}): ${r.errorType} - ${r.errorMessage}`));
      }

      return report;

    } catch (error: any) {
      console.error('Failed to validate facilitators:', error);
      throw new Error(`Validation failed: ${error.message}`);
    }
  }

  /**
   * Get the last validation report from cache
   */
  getLastReport(): ValidationReport | null {
    return this.lastReport;
  }

  /**
   * Validate specific credentials without storing (for testing before upload)
   */
  async validateCredentialsData(
    projectId: string,
    location: string,
    serviceAccountJson: string
  ): Promise<Omit<ValidationResult, 'facilitatorId' | 'facilitatorName'>> {
    const result = {
      isValid: false,
      validatedAt: new Date(),
    } as Omit<ValidationResult, 'facilitatorId' | 'facilitatorName'>;

    try {
      // Parse JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(serviceAccountJson);
      } catch (error) {
        result.errorType = 'parse_error';
        result.errorMessage = 'Invalid JSON format';
        return result;
      }

      // Check required fields
      const requiredFields = ['type', 'project_id', 'client_email', 'private_key', 'token_uri'];
      for (const field of requiredFields) {
        if (!parsedJson[field]) {
          result.errorType = 'parse_error';
          result.errorMessage = `Missing required field: ${field}`;
          return result;
        }
      }

      // Check project ID match
      if (parsedJson.project_id !== projectId) {
        result.errorType = 'project_mismatch';
        result.errorMessage = `Service account project_id (${parsedJson.project_id}) doesn't match provided project_id (${projectId})`;
        return result;
      }

      // Check location
      if (!location || location.trim() === '') {
        result.errorType = 'location_missing';
        result.errorMessage = 'Location is required';
        return result;
      }

      // Test token acquisition
      const auth = new GoogleAuth({
        credentials: parsedJson,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      const client = await auth.getClient();
      await client.getAccessToken();

      result.isValid = true;
      return result;

    } catch (authError: any) {
      if (authError.message?.includes('invalid_grant') || authError.code === 400) {
        result.errorType = 'token_error_invalid_grant';
        result.errorMessage = 'Invalid JWT signature or expired service account key';
      } else {
        result.errorType = 'unknown_error';
        result.errorMessage = `Authentication failed: ${authError.message}`;
      }
      return result;
    }
  }
}

export const credentialValidatorService = new CredentialValidatorService();