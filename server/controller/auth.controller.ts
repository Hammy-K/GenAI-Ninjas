import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";
import { db } from "server/db";
import { admins } from "server/schemas/admins";
import { signToken, TokenPayload, verifyToken } from "server/utils/auth.utils";
import { importSchools } from "server/scripts/importSchools";

export const login = async (req: Request, res: Response) => {
  try {
    await importSchools();
    const { username, password } = req.body;

    const admin = await db
      .select()
      .from(admins)
      .where(and(eq(admins.username, username), eq(admins.isActive, true)))
      .limit(1);

    if (!admin[0] || !(await bcrypt.compare(password, admin[0].passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload: TokenPayload = {
      adminId: admin[0].id,
      username: admin[0].username,
    };

    const token = signToken(payload);

    res.json({ token, username: admin[0].username });
  } catch (error) {
    console.error("Auth failed:", error);

    res.status(500).json({ error: "Auth failed" });
  }
};

export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = verifyToken(token);

    (req as any).admin = decoded;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
