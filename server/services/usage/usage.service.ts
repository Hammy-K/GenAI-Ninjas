/**
 * In-memory usage tracking service for video generation limits
 */

interface UsageData {
  used: number;
  lastReset?: Date;
}

class UsageService {
  private readonly usage = new Map<string, UsageData>();
  private readonly DEFAULT_LIMIT = 3;

  /**
   * Get current usage for a user
   */
  getUsage(uid: string): { used: number; limit: number } {
    const data = this.usage.get(uid) || { used: 0 };
    return {
      used: data.used,
      limit: this.DEFAULT_LIMIT,
    };
  }

  /**
   * Check if user has exceeded limit
   */
  hasExceededLimit(uid: string): boolean {
    const { used, limit } = this.getUsage(uid);
    return used >= limit;
  }

  /**
   * Increment usage for a user
   */
  incrementUsage(uid: string): { used: number; limit: number } {
    const currentData = this.usage.get(uid) || { used: 0 };
    const newUsage = {
      ...currentData,
      used: currentData.used + 1,
    };
    
    this.usage.set(uid, newUsage);
    
    return {
      used: newUsage.used,
      limit: this.DEFAULT_LIMIT,
    };
  }

  /**
   * Reset usage for a user (admin function)
   */
  resetUsage(uid: string): void {
    this.usage.set(uid, { used: 0, lastReset: new Date() });
  }

  /**
   * Get all usage data (admin function)
   */
  getAllUsage(): Map<string, UsageData> {
    return new Map(this.usage);
  }
}

// Singleton instance
export const usageService = new UsageService();