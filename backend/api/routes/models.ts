import { Request, Response, Router } from "express";
import { z } from "zod";

import pool from "../db";
import { validate } from "../middleware/validation";
import {
  CreateModelSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
  UpdateModelSchema,
  UuidSchema,
} from "../schemas";

const router = Router();

// ============================================================================
// Get All Models (with pagination)
// ============================================================================

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, user_id, name, description, file_name, file_size, mime_type, 
                is_public, processing_status, vertices_count, polygons_count, 
                created_at, updated_at 
         FROM models 
         WHERE is_public = true 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      pool.query("SELECT COUNT(*) FROM models WHERE is_public = true"),
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
    console.error("Get models error:", error);
    res.status(500).json(
      ErrorResponseSchema.parse({
        error: "Internal server error",
      }),
    );
  }
});

// ============================================================================
// Upload Model
// ============================================================================

router.post(
  "/",
  validate(
    z.object({
      body: CreateModelSchema,
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const {
        user_id,
        name,
        description,
        file_name,
        file_data,
        mime_type,
        is_public,
      } = req.body;

      // Decode base64 file data
      const fileBuffer = Buffer.from(file_data, "base64");
      const file_size = fileBuffer.length;

      // TODO: Store file in object storage (S3, Azure Blob, etc.)
      // For now, we'll just store metadata in database

      const result = await pool.query(
        `INSERT INTO models (user_id, name, description, file_name, file_size, mime_type, is_public) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, user_id, name, description, file_name, file_size, mime_type, 
                   is_public, processing_status, vertices_count, polygons_count, 
                   created_at, updated_at`,
        [
          user_id,
          name,
          description || null,
          file_name,
          file_size,
          mime_type,
          is_public,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Upload model error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Get Model by ID
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
        `SELECT id, user_id, name, description, file_name, file_size, mime_type, 
                is_public, processing_status, vertices_count, polygons_count, 
                created_at, updated_at 
         FROM models 
         WHERE id = $1 AND is_public = true`,
        [id],
      );

      if (result.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "Model not found",
          }),
        );
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Get model error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Download Model File
// ============================================================================

router.get(
  "/:id/download",
  validate(
    z.object({
      params: z.object({ id: UuidSchema }),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT file_name, mime_type FROM models WHERE id = $1 AND is_public = true`,
        [id],
      );

      if (result.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "Model not found",
          }),
        );
        return;
      }

      // TODO: Retrieve file from object storage
      // For now, return a placeholder response
      res.setHeader("Content-Type", result.rows[0].mime_type);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.rows[0].file_name}"`,
      );
      res.send("TODO: Implement file storage");
    } catch (error) {
      console.error("Download model error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Update Model
// ============================================================================

router.patch(
  "/:id",
  validate(
    z.object({
      params: z.object({ id: UuidSchema }),
      body: UpdateModelSchema,
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
        `UPDATE models 
         SET ${setClauses.join(", ")}, updated_at = NOW() 
         WHERE id = $${values.length} 
         RETURNING id, user_id, name, description, file_name, file_size, mime_type, 
                   is_public, processing_status, vertices_count, polygons_count, 
                   created_at, updated_at`,
        values,
      );

      if (result.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "Model not found",
          }),
        );
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Update model error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Delete Model
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

      // TODO: Delete file from object storage

      const result = await pool.query(
        "DELETE FROM models WHERE id = $1 RETURNING id",
        [id],
      );

      if (result.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "Model not found",
          }),
        );
        return;
      }

      res.json(
        SuccessResponseSchema.parse({
          message: "Model deleted successfully",
        }),
      );
    } catch (error) {
      console.error("Delete model error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

export default router;
