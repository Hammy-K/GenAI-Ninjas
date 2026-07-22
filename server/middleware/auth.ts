/**
 * Authentication middleware for API requests
 */
import { Request, Response, NextFunction } from 'express';

// Extend Express session to include admin flag
declare module "express-session" {
  interface SessionData {
    user?: {
      uid: string;
      email: string;
      isAdmin?: boolean;
    };
  }
}

/**
 * Middleware to check if user is authenticated
 * Verifies that req.session.user.uid exists
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user?.uid) {
    console.log('[AUTH] Unauthorized access attempt - missing uid');
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log(`[AUTH] User ${req.session.user.uid} authenticated for ${req.method} ${req.path}`);
  next();
}

/**
 * Middleware to check if user is authenticated AND is an admin
 * Verifies that req.session.user.uid exists and req.session.user.isAdmin is true
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user?.uid) {
    console.log('[AUTH] Admin access attempt - missing uid');
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!req.session.user.isAdmin) {
    console.log(`[AUTH] Admin access denied for user ${req.session.user.uid} (${req.method} ${req.path})`);
    return res.status(403).json({ error: "Forbidden" });
  }

  console.log(`[AUTH] Admin ${req.session.user.uid} authenticated for ${req.method} ${req.path}`);
  next();
}
