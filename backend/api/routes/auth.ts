import bcrypt from "bcryptjs";
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

import pool from "../db";
import { validate } from "../middleware/validation";
import { CreateUserSchema, ErrorResponseSchema, LoginSchema } from "../schemas";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const router = Router();

// ============================================================================
// Register
// ============================================================================

router.post(
  "/register",
  validate(
    z.object({
      body: CreateUserSchema,
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { username, email, password, full_name } = req.body;

      // Check if user already exists
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE username = $1 OR email = $2",
        [username, email],
      );

      if (existingUser.rows.length > 0) {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error: "User with this username or email already exists",
          }),
        );
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, username, email, full_name, is_admin, created_at, updated_at`,
        [username, email, hashedPassword, full_name || null],
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Login
// ============================================================================

router.post(
  "/login",
  validate(
    z.object({
      body: LoginSchema,
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      const result = await pool.query(
        `SELECT id, username, email, password_hash, full_name, is_admin, created_at, updated_at 
         FROM users 
         WHERE username = $1 OR email = $1`,
        [username],
      );

      if (result.rows.length === 0) {
        res.status(401).json(
          ErrorResponseSchema.parse({
            error: "Invalid credentials",
          }),
        );
        return;
      }

      const user = result.rows[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        res.status(401).json(
          ErrorResponseSchema.parse({
            error: "Invalid credentials",
          }),
        );
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          isAdmin: user.is_admin,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
      );

      // Remove password_hash from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash: _password, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

export default router;
