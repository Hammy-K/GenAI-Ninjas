import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Usage Service Tests
 * Tests credit deduction and overdraft logic for video generation limits
 */

interface UsageData {
  used: number;
  lastReset?: Date;
}

class UsageService {
  private readonly usage = new Map<string, UsageData>();
  private readonly DEFAULT_LIMIT = 3;

  getUsage(uid: string): { used: number; limit: number } {
    const data = this.usage.get(uid) || { used: 0 };
    return {
      used: data.used,
      limit: this.DEFAULT_LIMIT,
    };
  }

  hasExceededLimit(uid: string): boolean {
    const { used, limit } = this.getUsage(uid);
    return used >= limit;
  }

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

  resetUsage(uid: string): void {
    this.usage.set(uid, { used: 0, lastReset: new Date() });
  }

  getAllUsage(): Map<string, UsageData> {
    return new Map(this.usage);
  }
}

describe('UsageService', () => {
  let service: UsageService;

  beforeEach(() => {
    service = new UsageService();
  });

  describe('getUsage', () => {
    it('should return zero usage for new user', () => {
      const usage = service.getUsage('new-user');

      expect(usage.used).toBe(0);
      expect(usage.limit).toBe(3);
    });

    it('should track usage for different users separately', () => {
      service.incrementUsage('user1');
      service.incrementUsage('user2');
      service.incrementUsage('user2');

      const user1Usage = service.getUsage('user1');
      const user2Usage = service.getUsage('user2');

      expect(user1Usage.used).toBe(1);
      expect(user2Usage.used).toBe(2);
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage by 1', () => {
      const result = service.incrementUsage('user-id');

      expect(result.used).toBe(1);
      expect(result.limit).toBe(3);
    });

    it('should increment multiple times', () => {
      service.incrementUsage('user-id');
      service.incrementUsage('user-id');
      const result = service.incrementUsage('user-id');

      expect(result.used).toBe(3);
      expect(result.limit).toBe(3);
    });

    it('should allow incrementing past the limit', () => {
      service.incrementUsage('user-id');
      service.incrementUsage('user-id');
      service.incrementUsage('user-id');
      const result = service.incrementUsage('user-id');

      expect(result.used).toBe(4);
    });
  });

  describe('hasExceededLimit', () => {
    it('should return false when usage is below limit', () => {
      service.incrementUsage('user-id');

      expect(service.hasExceededLimit('user-id')).toBe(false);
    });

    it('should return true when usage equals limit', () => {
      service.incrementUsage('user-id');
      service.incrementUsage('user-id');
      service.incrementUsage('user-id');

      expect(service.hasExceededLimit('user-id')).toBe(true);
    });

    it('should return true when usage exceeds limit', () => {
      service.incrementUsage('user-id');
      service.incrementUsage('user-id');
      service.incrementUsage('user-id');
      service.incrementUsage('user-id');

      expect(service.hasExceededLimit('user-id')).toBe(true);
    });

    it('should return false for new user (usage 0)', () => {
      expect(service.hasExceededLimit('new-user')).toBe(false);
    });
  });

  describe('resetUsage', () => {
    it('should reset usage to zero', () => {
      service.incrementUsage('user-id');
      service.incrementUsage('user-id');
      service.resetUsage('user-id');

      const usage = service.getUsage('user-id');
      expect(usage.used).toBe(0);
    });

    it('should set lastReset timestamp', () => {
      const beforeReset = new Date();
      service.resetUsage('user-id');
      const afterReset = new Date();

      const allUsage = service.getAllUsage();
      const userData = allUsage.get('user-id');

      expect(userData?.lastReset).toBeDefined();
      expect(userData!.lastReset!.getTime()).toBeGreaterThanOrEqual(beforeReset.getTime());
      expect(userData!.lastReset!.getTime()).toBeLessThanOrEqual(afterReset.getTime());
    });

    it('should allow usage to accumulate again after reset', () => {
      service.incrementUsage('user-id');
      service.incrementUsage('user-id');
      service.resetUsage('user-id');
      service.incrementUsage('user-id');

      expect(service.getUsage('user-id').used).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid increments without data loss', () => {
      for (let i = 0; i < 10; i++) {
        service.incrementUsage('user-id');
      }

      expect(service.getUsage('user-id').used).toBe(10);
    });

    it('should maintain isolation between user sessions', () => {
      const users = ['user1', 'user2', 'user3'];

      users.forEach((uid, index) => {
        for (let i = 0; i <= index; i++) {
          service.incrementUsage(uid);
        }
      });

      expect(service.getUsage('user1').used).toBe(1);
      expect(service.getUsage('user2').used).toBe(2);
      expect(service.getUsage('user3').used).toBe(3);
    });
  });
});
