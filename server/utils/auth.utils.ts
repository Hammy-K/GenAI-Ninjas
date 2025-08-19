import jwt from "jsonwebtoken";
import { JWT_SECRET } from "server/config/env.config";

export interface TokenPayload {
  adminId: number;
  username: string;
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "24h" });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET!) as TokenPayload;
};
