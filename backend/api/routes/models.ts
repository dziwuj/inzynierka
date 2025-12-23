import { Request, Response, Router } from "express";
import multer from "multer";
import { z } from "zod";

import pool from "../db";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validation";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  UuidSchema,
} from "../schemas";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
}); // 100MB limit

// Storage limit per user (500MB)
const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;

// ============================================================================
// Get Storage Info (authenticated)
// ============================================================================

router.get(
  "/storage/info",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const result = await pool.query(
        `SELECT COALESCE(SUM(file_size), 0) as used_bytes, COUNT(*) as model_count 
       FROM models 
       WHERE user_id = $1`,
        [userId],
      );

      res.json({
        usedBytes: parseInt(result.rows[0].used_bytes),
        maxBytes: STORAGE_LIMIT_BYTES,
        modelCount: parseInt(result.rows[0].model_count),
      });
    } catch (error) {
      console.error("Get storage info error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Get All User Models (authenticated)
// ============================================================================

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await pool.query(
      `SELECT id, user_id, name, file_format, file_size, 
              created_at, updated_at 
       FROM models 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId],
    );

    // Transform to match frontend Model interface
    const models = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      fileName: `${row.name}.${row.file_format.toLowerCase()}`,
      fileSize: row.file_size,
      fileFormat: row.file_format.toUpperCase(),
      fileUrl: `/api/models/${row.id}/download`,
      thumbnailUrl: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(models);
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
// Upload Model (authenticated)
// ============================================================================

router.post(
  "/",
  authenticate,
  upload.single("model"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { name } = req.body;
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error: "No file uploaded",
          }),
        );
        return;
      }

      if (!name || name.trim() === "") {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error: "Model name is required",
          }),
        );
        return;
      }

      // Extract file extension
      const fileExtension =
        file.originalname.split(".").pop()?.toLowerCase() || "";
      const allowedExtensions = ["gltf", "glb", "fbx", "obj", "stl", "ply"];

      if (!allowedExtensions.includes(fileExtension)) {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error: "Invalid file format",
            message: `Allowed formats: ${allowedExtensions.join(", ")}`,
          }),
        );
        return;
      }

      // Check storage limit
      const storageResult = await pool.query(
        `SELECT COALESCE(SUM(file_size), 0) as used_bytes 
         FROM models 
         WHERE user_id = $1`,
        [userId],
      );

      const usedBytes = parseInt(storageResult.rows[0].used_bytes);
      if (usedBytes + file.size > STORAGE_LIMIT_BYTES) {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error: "Storage limit exceeded",
            message: `You have used ${(usedBytes / (1024 * 1024)).toFixed(2)}MB of ${(STORAGE_LIMIT_BYTES / (1024 * 1024)).toFixed(0)}MB. This file would exceed your limit.`,
          }),
        );
        return;
      }

      // TODO: Store file in object storage (S3, Azure Blob, etc.)
      // For now, we'll store the file as BYTEA in database (NOT recommended for production)

      const result = await pool.query(
        `INSERT INTO models (user_id, name, file_format, file_size, file_data) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, user_id, name, file_format, file_size, created_at, updated_at`,
        [userId, name.trim(), fileExtension, file.size, file.buffer],
      );

      const row = result.rows[0];
      const model = {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        fileName: `${row.name}.${row.file_format}`,
        fileSize: row.file_size,
        fileFormat: row.file_format.toUpperCase(),
        fileUrl: `/api/models/${row.id}/download`,
        thumbnailUrl: null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      res.status(201).json({
        model,
        message: "Model uploaded successfully",
      });
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
// Get Model by ID (authenticated)
// ============================================================================

router.get(
  "/:id",
  authenticate,
  validate(
    z.object({
      params: z.object({ id: UuidSchema }),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const result = await pool.query(
        `SELECT id, user_id, name, file_format, file_size, 
                created_at, updated_at 
         FROM models 
         WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );

      if (result.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "Model not found",
          }),
        );
        return;
      }

      const row = result.rows[0];
      const model = {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        fileName: `${row.name}.${row.file_format}`,
        fileSize: row.file_size,
        fileFormat: row.file_format.toUpperCase(),
        fileUrl: `/api/models/${row.id}/download`,
        thumbnailUrl: null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      res.json(model);
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
// Download Model File (authenticated)
// ============================================================================

router.get(
  "/:id/download",
  authenticate,
  validate(
    z.object({
      params: z.object({ id: UuidSchema }),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const result = await pool.query(
        `SELECT file_format, file_data FROM models WHERE id = $1 AND user_id = $2`,
        [id, userId],
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
      // For now, return BYTEA data from database
      const fileBuffer = result.rows[0].file_data;
      const fileExtension = result.rows[0].file_format;

      // Determine MIME type
      const mimeTypes: Record<string, string> = {
        gltf: "model/gltf+json",
        glb: "model/gltf-binary",
        fbx: "application/octet-stream",
        obj: "text/plain",
        stl: "application/vnd.ms-pki.stl",
        ply: "application/octet-stream",
      };

      res.setHeader(
        "Content-Type",
        mimeTypes[fileExtension] || "application/octet-stream",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="model.${fileExtension}"`,
      );
      res.send(fileBuffer);
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
// Delete Model (authenticated)
// ============================================================================

router.delete(
  "/:id",
  authenticate,
  validate(
    z.object({
      params: z.object({ id: UuidSchema }),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const result = await pool.query(
        "DELETE FROM models WHERE id = $1 AND user_id = $2 RETURNING id",
        [id, userId],
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
