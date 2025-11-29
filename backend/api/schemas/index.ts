import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// ============================================================================
// Common Schemas
// ============================================================================

export const UuidSchema = z.string().uuid().openapi({
  description: "UUID v7 identifier",
  example: "01234567-89ab-cdef-0123-456789abcdef",
});

export const EmailSchema = z.string().email().openapi({
  description: "Valid email address",
  example: "user@example.com",
});

export const TimestampSchema = z.string().datetime().openapi({
  description: "ISO 8601 timestamp",
  example: "2025-11-28T14:30:00Z",
});

// ============================================================================
// User Schemas
// ============================================================================

export const UserSchema = z
  .object({
    id: UuidSchema,
    username: z.string().min(3).max(50).openapi({
      description: "Unique username",
      example: "john_doe",
    }),
    email: EmailSchema,
    full_name: z.string().max(255).nullable().openapi({
      description: "User full name",
      example: "John Doe",
    }),
    is_admin: z.boolean().default(false).openapi({
      description: "Admin privileges flag",
    }),
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
  })
  .openapi("User");

export const CreateUserSchema = z
  .object({
    username: z.string().min(3).max(50).openapi({
      description: "Unique username",
      example: "john_doe",
    }),
    email: EmailSchema,
    password: z.string().min(8).openapi({
      description: "User password (min 8 characters)",
      example: "securePassword123",
    }),
    full_name: z.string().max(255).optional().openapi({
      description: "User full name",
      example: "John Doe",
    }),
  })
  .openapi("CreateUser");

export const UpdateUserSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    email: EmailSchema.optional(),
    full_name: z.string().max(255).nullable().optional(),
    is_admin: z.boolean().optional(),
  })
  .openapi("UpdateUser");

export const LoginSchema = z
  .object({
    username: z.string().openapi({
      description: "Username or email",
      example: "john_doe",
    }),
    password: z.string().openapi({
      description: "User password",
      example: "securePassword123",
    }),
  })
  .openapi("Login");

export const LoginResponseSchema = z
  .object({
    user: UserSchema,
    token: z.string().openapi({
      description: "JWT authentication token",
    }),
  })
  .openapi("LoginResponse");

// ============================================================================
// Model Schemas
// ============================================================================

export const ModelSchema = z
  .object({
    id: UuidSchema,
    user_id: UuidSchema,
    name: z.string().max(255).openapi({
      description: "Model name",
      example: "My 3D Model",
    }),
    description: z.string().nullable().openapi({
      description: "Model description",
      example: "A detailed 3D model",
    }),
    file_name: z.string().max(255).openapi({
      description: "Original file name",
      example: "model.obj",
    }),
    file_size: z.number().int().openapi({
      description: "File size in bytes",
      example: 1024000,
    }),
    mime_type: z.string().max(100).openapi({
      description: "MIME type",
      example: "model/obj",
    }),
    is_public: z.boolean().default(false).openapi({
      description: "Public visibility flag",
    }),
    processing_status: z
      .enum(["pending", "processing", "completed", "failed"])
      .default("pending")
      .openapi({
        description: "Processing status",
      }),
    vertices_count: z.number().int().nullable().openapi({
      description: "Number of vertices",
      example: 10000,
    }),
    polygons_count: z.number().int().nullable().openapi({
      description: "Number of polygons",
      example: 8000,
    }),
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
  })
  .openapi("Model");

export const CreateModelSchema = z
  .object({
    user_id: UuidSchema,
    name: z.string().max(255).openapi({
      description: "Model name",
      example: "My 3D Model",
    }),
    description: z.string().optional().openapi({
      description: "Model description",
      example: "A detailed 3D model",
    }),
    file_name: z.string().max(255).openapi({
      description: "Original file name",
      example: "model.obj",
    }),
    file_data: z.string().openapi({
      description: "Base64 encoded file data",
    }),
    mime_type: z.string().max(100).openapi({
      description: "MIME type",
      example: "model/obj",
    }),
    is_public: z.boolean().default(false).optional(),
  })
  .openapi("CreateModel");

export const UpdateModelSchema = z
  .object({
    name: z.string().max(255).optional(),
    description: z.string().nullable().optional(),
    is_public: z.boolean().optional(),
    processing_status: z
      .enum(["pending", "processing", "completed", "failed"])
      .optional(),
    vertices_count: z.number().int().nullable().optional(),
    polygons_count: z.number().int().nullable().optional(),
  })
  .openapi("UpdateModel");

// ============================================================================
// Response Schemas
// ============================================================================

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: "Error message",
      example: "Validation failed",
    }),
    details: z
      .array(
        z.object({
          path: z.string(),
          message: z.string(),
        }),
      )
      .optional()
      .openapi({
        description: "Detailed error information",
      }),
  })
  .openapi("ErrorResponse");

export const SuccessResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Success message",
      example: "Operation completed successfully",
    }),
  })
  .openapi("SuccessResponse");

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
  });

// ============================================================================
// Type Exports
// ============================================================================

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type CreateModel = z.infer<typeof CreateModelSchema>;
export type UpdateModel = z.infer<typeof UpdateModelSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
