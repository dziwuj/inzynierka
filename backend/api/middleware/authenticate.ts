import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
  isAdmin: boolean;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      (req as AuthenticatedRequest).userId = decoded.userId;
      (req as AuthenticatedRequest).userEmail = decoded.email;
      (req as AuthenticatedRequest).isAdmin = decoded.isAdmin;
      next();
    } catch {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
