import { put } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
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

// Extend Express Request to include authenticated user info
interface AuthenticatedRequest extends Request {
  userId: string;
  files?: {
    models?: Express.Multer.File[];
    thumbnail?: Express.Multer.File[];
  };
}

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB per file
    files: 20, // Max 20 files
  },
});

// Storage limit per user (500MB)
const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;

interface ClientPayload {
  filename?: string;
  token?: string;
}

// ============================================================================
// Generate Client Upload Token for Vercel Blob (authenticated)
// This allows client-side direct uploads to bypass serverless limits
// ============================================================================

router.post("/upload-token", async (req: Request, res: Response) => {
  try {
    // handleUpload sends the request with specific structure:
    // req.body.payload.clientPayload contains our JSON string
    const clientPayloadString = req.body.payload?.clientPayload;

    if (!clientPayloadString) {
      res.status(400).json({
        error: "Missing clientPayload",
        debug: { body: req.body },
      });
      return;
    }

    const clientPayload: ClientPayload = JSON.parse(clientPayloadString);
    const { filename, token } = clientPayload;

    if (!filename || !token) {
      res.status(400).json({
        error: "Missing filename or token in clientPayload",
      });
      return;
    }

    // Verify JWT token
    let userId: string;
    try {
      const JWT_SECRET =
        process.env.JWT_SECRET || "your-secret-key-change-in-production";
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    // Check storage limit
    const storageResult = await pool.query(
      `SELECT COALESCE(SUM(total_size), 0) as used_bytes 
       FROM models WHERE user_id = $1`,
      [userId],
    );

    const usedBytes = parseInt(storageResult.rows[0].used_bytes);
    if (usedBytes >= STORAGE_LIMIT_BYTES) {
      res.status(413).json({
        error: "Storage limit exceeded",
        message: `You have used ${(usedBytes / (1024 * 1024)).toFixed(2)}MB of ${STORAGE_LIMIT_BYTES / (1024 * 1024)}MB`,
      });
      return;
    }

    // Generate upload token using handleUpload
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => {
        // Generate unique pathname
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const uniquePathname = `models/${userId}/${timestamp}-${randomString}-${filename}`;

        return {
          allowedContentTypes: [
            "model/gltf+json",
            "model/gltf-binary",
            "application/octet-stream",
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/jpg",
            "text/plain",
            "application/json",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
          tokenPayload: JSON.stringify({
            userId,
            filename,
          }),
          addRandomSuffix: false,
          pathname: uniquePathname,
        };
      },
      onUploadCompleted: async () => {
        // No-op - client will call /blob endpoint after all uploads complete
      },
    });

    res.json(jsonResponse);
  } catch (error) {
    console.error("Generate upload token error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================================================
// Legacy: Upload File via Backend (limited by serverless constraints)
// ============================================================================

router.post(
  "/upload-file",
  authenticate,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          error: "No file provided",
        });
        return;
      }

      // Check storage limit
      const storageResult = await pool.query(
        `SELECT COALESCE(SUM(total_size), 0) as used_bytes 
         FROM models WHERE user_id = $1`,
        [userId],
      );

      const usedBytes = parseInt(storageResult.rows[0].used_bytes);
      if (usedBytes >= STORAGE_LIMIT_BYTES) {
        res.status(413).json({
          error: "Storage limit exceeded",
          message: `You have used ${(usedBytes / (1024 * 1024)).toFixed(2)}MB of ${STORAGE_LIMIT_BYTES / (1024 * 1024)}MB`,
        });
        return;
      }

      // Generate a unique pathname for the file
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const pathname = `models/${userId}/${timestamp}-${randomString}-${file.originalname}`;

      // Upload to Vercel Blob
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN not configured");
      }

      const blob = await put(pathname, file.buffer, {
        access: "public",
        token,
        addRandomSuffix: false,
        contentType: file.mimetype || "application/octet-stream",
      });

      res.json({
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// ============================================================================
// Get Storage Info (authenticated)
// ============================================================================

router.get(
  "/storage/info",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;

      const result = await pool.query(
        `SELECT COALESCE(SUM(total_size), 0) as used_bytes, COUNT(*) as model_count 
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
    const userId = (req as AuthenticatedRequest).userId;

    const result = await pool.query(
      `SELECT id, user_id, name, file_format, total_size, 
              created_at, updated_at, thumbnail 
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
      fileSize: row.total_size,
      fileFormat: row.file_format.toUpperCase(),
      fileUrl: `/api/models/${row.id}/download`,
      thumbnailUrl: row.thumbnail ? `/models/${row.id}/thumbnail` : null,
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
// Save Model Metadata After Blob Upload (authenticated)
// ============================================================================

interface BlobFileUrl {
  url: string;
  pathname: string;
  size: number;
}

router.post("/blob", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { name, fileUrls, thumbnailUrl, totalSize } = req.body;

    if (
      !name ||
      !fileUrls ||
      !Array.isArray(fileUrls) ||
      fileUrls.length === 0
    ) {
      res.status(400).json({
        error: "Missing required fields",
        message: "name, fileUrls (array) are required",
      });
      return;
    }

    // Check storage limit
    const storageResult = await pool.query(
      `SELECT COALESCE(SUM(total_size), 0) as used_bytes 
       FROM models WHERE user_id = $1`,
      [userId],
    );

    const usedBytes = parseInt(storageResult.rows[0].used_bytes);
    if (usedBytes + totalSize > STORAGE_LIMIT_BYTES) {
      res.status(413).json({
        error: "Storage limit exceeded",
        message: `Adding this model would exceed your ${STORAGE_LIMIT_BYTES / (1024 * 1024)}MB limit`,
      });
      return;
    }

    // Find main model file
    const mainFile = (fileUrls as BlobFileUrl[]).find(f => {
      const ext = f.pathname?.split(".").pop()?.toLowerCase() || "";
      return ["gltf", "glb", "obj", "stl", "ply"].includes(ext);
    });

    if (!mainFile) {
      res.status(400).json({
        error: "No valid model file found",
      });
      return;
    }

    const fileFormat =
      mainFile.pathname.split(".").pop()?.toUpperCase() || "UNKNOWN";

    // Save model metadata to database
    const result = await pool.query(
      `INSERT INTO models (user_id, name, file_format, total_size)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at, updated_at`,
      [userId, name, fileFormat, totalSize],
    );

    const modelId = result.rows[0].id;

    // Save all files to model_files table (storing URL in file_path as a workaround)
    // Since model_files expects BYTEA for file_data, we'll store a placeholder
    for (const file of fileUrls) {
      const isMainFile = file.url === mainFile.url;

      await pool.query(
        `INSERT INTO model_files (model_id, file_path, file_data, file_size, is_main_file, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          modelId,
          file.url, // Store URL in file_path field
          Buffer.from(""), // Empty buffer as placeholder
          file.size || 1, // Minimum 1 to satisfy check constraint
          isMainFile,
          "application/octet-stream",
        ],
      );
    }

    // Save thumbnail URL if provided (in a similar way)
    if (thumbnailUrl) {
      await pool.query(
        `INSERT INTO model_files (model_id, file_path, file_data, file_size, is_main_file, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [modelId, thumbnailUrl, Buffer.from(""), 1, false, "image/jpeg"],
      );
    }

    res.json({
      id: modelId,
      userId,
      name,
      fileName: `${name}.${fileFormat.toLowerCase()}`,
      fileSize: totalSize,
      fileFormat,
      fileUrl: mainFile.url,
      thumbnailUrl: thumbnailUrl || null,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    });
  } catch (error) {
    console.error("Save blob model error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================================================
// Upload Model (authenticated) - Legacy endpoint for small files
// ============================================================================

router.post(
  "/",
  authenticate,
  upload.fields([
    { name: "models", maxCount: 50 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { name } = req.body;
      const filesObj = (req as AuthenticatedRequest).files;
      const files = filesObj?.models || [];
      const thumbnailFile = filesObj?.thumbnail?.[0];

      if (files.length === 0) {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error: "No files uploaded",
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

      const allowedModelExtensions = ["gltf", "glb", "obj", "stl", "ply"];
      const allowedAssetExtensions = [
        "bin",
        "mtl",
        "jpg",
        "jpeg",
        "png",
        "webp",
        "ktx2",
      ];

      // Find the main model file
      const mainModelFile = files.find(file => {
        const ext = file.originalname.split(".").pop()?.toLowerCase() || "";
        return allowedModelExtensions.includes(ext);
      });

      if (!mainModelFile) {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error: "No valid model file found",
            message: `Allowed model formats: ${allowedModelExtensions.join(", ")}`,
          }),
        );
        return;
      }

      const mainFileExtension =
        mainModelFile.originalname.split(".").pop()?.toLowerCase() || "";

      // Validate all files
      for (const file of files) {
        const ext = file.originalname.split(".").pop()?.toLowerCase() || "";
        if (
          !allowedModelExtensions.includes(ext) &&
          !allowedAssetExtensions.includes(ext)
        ) {
          res.status(400).json(
            ErrorResponseSchema.parse({
              error: `Invalid file format: ${file.originalname}`,
              message: `Allowed formats: ${[...allowedModelExtensions, ...allowedAssetExtensions].join(", ")}`,
            }),
          );
          return;
        }
      }

      // Calculate total size
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      // Check storage limit
      const storageResult = await pool.query(
        `SELECT COALESCE(SUM(total_size), 0) as used_bytes 
         FROM models 
         WHERE user_id = $1`,
        [userId],
      );

      const usedBytes = parseInt(storageResult.rows[0].used_bytes);
      if (usedBytes + totalSize > STORAGE_LIMIT_BYTES) {
        res.status(400).json(
          ErrorResponseSchema.parse({
            error: "Storage limit exceeded",
            message: `You have used ${(usedBytes / (1024 * 1024)).toFixed(2)}MB of ${(STORAGE_LIMIT_BYTES / (1024 * 1024)).toFixed(0)}MB. This upload would exceed your limit.`,
          }),
        );
        return;
      }

      // Begin transaction
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Insert model metadata with thumbnail
        const modelResult = await client.query(
          `INSERT INTO models (user_id, name, file_format, total_size, thumbnail) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id, user_id, name, file_format, total_size, created_at, updated_at`,
          [
            userId,
            name.trim(),
            mainFileExtension,
            totalSize,
            thumbnailFile?.buffer || null,
          ],
        );

        const modelId = modelResult.rows[0].id;

        // Insert all files into model_files table
        for (const file of files) {
          const isMainFile = file === mainModelFile;
          const ext = file.originalname.split(".").pop()?.toLowerCase() || "";

          // Determine MIME type
          let mimeType = file.mimetype;
          if (ext === "gltf") mimeType = "model/gltf+json";
          else if (ext === "glb") mimeType = "model/gltf-binary";
          else if (ext === "obj") mimeType = "model/obj";
          else if (ext === "stl") mimeType = "model/stl";
          else if (ext === "ply") mimeType = "model/ply";
          else if (ext === "mtl") mimeType = "model/mtl";
          else if (ext === "bin") mimeType = "application/octet-stream";

          await client.query(
            `INSERT INTO model_files (model_id, file_path, file_data, file_size, mime_type, is_main_file) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              modelId,
              file.originalname,
              file.buffer,
              file.size,
              mimeType,
              isMainFile,
            ],
          );
        }

        await client.query("COMMIT");

        const row = modelResult.rows[0];
        const model = {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          fileName: `${row.name}.${row.file_format}`,
          fileSize: row.total_size,
          fileFormat: row.file_format.toUpperCase(),
          fileUrl: `/api/models/${row.id}/download`,
          thumbnailUrl: null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        res.status(201).json({
          model,
          message: `Model uploaded successfully with ${files.length} file(s)`,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
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
      const userId = (req as AuthenticatedRequest).userId;

      const result = await pool.query(
        `SELECT id, user_id, name, file_format, total_size, 
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
        fileSize: row.total_size,
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
      const userId = (req as AuthenticatedRequest).userId;

      // Verify model belongs to user
      const modelCheck = await pool.query(
        `SELECT id, name, file_format FROM models WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );

      if (modelCheck.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "Model not found",
          }),
        );
        return;
      }

      const modelName = modelCheck.rows[0].name;
      const fileExtension = modelCheck.rows[0].file_format;

      // Get the main model file
      const fileResult = await pool.query(
        `SELECT file_data, mime_type FROM model_files 
         WHERE model_id = $1 AND is_main_file = TRUE`,
        [id],
      );

      if (fileResult.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "Model file not found",
          }),
        );
        return;
      }

      const fileBuffer = fileResult.rows[0].file_data;
      const mimeType =
        fileResult.rows[0].mime_type || "application/octet-stream";

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${modelName}.${fileExtension}"`,
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
// Get Model Thumbnail (authenticated)
// ============================================================================

router.get(
  "/:id/thumbnail",
  authenticate,
  validate(
    z.object({
      params: z.object({ id: UuidSchema }),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).userId;

      const result = await pool.query(
        `SELECT thumbnail FROM models 
         WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );

      if (result.rows.length === 0 || !result.rows[0].thumbnail) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "Thumbnail not found",
          }),
        );
        return;
      }

      const thumbnailBuffer = result.rows[0].thumbnail;

      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.send(thumbnailBuffer);
    } catch (error) {
      console.error("Get thumbnail error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Get Model Assets (authenticated) - for textures, .bin files, etc.
// ============================================================================

router.get(
  "/:id/assets",
  authenticate,
  validate(
    z.object({
      params: z.object({ id: UuidSchema }),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).userId;

      // Verify model belongs to user
      const modelCheck = await pool.query(
        `SELECT id FROM models WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );

      if (modelCheck.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "Model not found",
          }),
        );
        return;
      }

      // Get all files for this model (excluding main file)
      const filesResult = await pool.query(
        `SELECT id, file_path, file_size, mime_type 
         FROM model_files 
         WHERE model_id = $1 AND is_main_file = FALSE
         ORDER BY file_path`,
        [id],
      );

      const assets = filesResult.rows.map(row => ({
        id: row.id,
        fileName: row.file_path,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        downloadUrl: `/api/models/${id}/assets/${encodeURIComponent(row.file_path)}`,
      }));

      res.json(assets);
    } catch (error) {
      console.error("Get model assets error:", error);
      res.status(500).json(
        ErrorResponseSchema.parse({
          error: "Internal server error",
        }),
      );
    }
  },
);

// ============================================================================
// Download Model Asset File (authenticated)
// ============================================================================

router.get(
  "/:id/assets/:fileName",
  authenticate,
  validate(
    z.object({
      params: z.object({
        id: UuidSchema,
        fileName: z.string(),
      }),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id, fileName } = req.params;
      const userId = (req as AuthenticatedRequest).userId;

      // Verify model belongs to user and get file
      const result = await pool.query(
        `SELECT mf.file_data, mf.mime_type, mf.file_path
         FROM model_files mf
         JOIN models m ON mf.model_id = m.id
         WHERE m.id = $1 AND m.user_id = $2 AND mf.file_path = $3`,
        [id, userId, decodeURIComponent(fileName)],
      );

      if (result.rows.length === 0) {
        res.status(404).json(
          ErrorResponseSchema.parse({
            error: "Asset not found",
          }),
        );
        return;
      }

      const fileBuffer = result.rows[0].file_data;
      const mimeType = result.rows[0].mime_type || "application/octet-stream";
      const filePath = result.rows[0].file_path;

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${filePath.split("/").pop()}"`,
      );
      res.send(fileBuffer);
    } catch (error) {
      console.error("Download asset error:", error);
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
      const userId = (req as AuthenticatedRequest).userId;

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
