import { Request, Response, Router } from "express";
import { z } from "zod";

import pool from "../db";
import { validate } from "../middleware/validation";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  UpdateUserSchema,
  UuidSchema,
} from "../schemas";

const router = Router();

// ============================================================================
// Get All Users (with pagination)
// ============================================================================

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, username, email, full_name, is_admin, created_at, updated_at 
         FROM users 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      pool.query("SELECT COUNT(*) FROM users"),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json(
      ErrorResponseSchema.parse({
        error: "Internal server error",
      }),
    );
  }
});

// ============================================================================
// Get User by ID
// ============================================================================

router.get(
  "/:id",
  validate(
    z.object({
      params: z.object({ id: UuidSchema }),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT id, username, email, full_name, is_admin, created_at, updated_at 
         FROM users 
         WHERE id = $1`,
        [id],
      );

      if (result.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "User not found",
          }),
        );
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Update User
// ============================================================================

router.patch(
  "/:id",
  validate(
    z.object({
      params: z.object({ id: UuidSchema }),
      body: UpdateUserSchema,
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const fields = Object.keys(updates);
      if (fields.length === 0) {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error: "No fields to update",
          }),
        );
        return;
      }

      const values: unknown[] = [];
      const setClauses = fields.map((field, index) => {
        values.push(updates[field]);
        return `${field} = $${index + 1}`;
      });

      values.push(id);

      const result = await pool.query(
        `UPDATE users 
         SET ${setClauses.join(", ")}, updated_at = NOW() 
         WHERE id = $${values.length} 
         RETURNING id, username, email, full_name, is_admin, created_at, updated_at`,
        values,
      );

      if (result.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "User not found",
          }),
        );
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Delete User
// ============================================================================

router.delete(
  "/:id",
  validate(
    z.object({
      params: z.object({ id: UuidSchema }),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        "DELETE FROM users WHERE id = $1 RETURNING id",
        [id],
      );

      if (result.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "User not found",
          }),
        );
        return;
      }

      res.json(
        SuccessResponseSchema.parse({
          message: "User deleted successfully",
        }),
      );
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

export default router;
