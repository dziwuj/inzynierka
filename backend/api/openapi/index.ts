import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  CreateModelSchema,
  CreateUserSchema,
  ErrorResponseSchema,
  LoginResponseSchema,
  LoginSchema,
  ModelSchema,
  PaginatedResponseSchema,
  SuccessResponseSchema,
  UpdateModelSchema,
  UpdateUserSchema,
  UserSchema,
  UuidSchema,
} from "../schemas";

// Path parameter schemas
const PathIdSchema = z.object({
  id: UuidSchema,
});

const registry = new OpenAPIRegistry();

// Register schemas
registry.register("User", UserSchema);
registry.register("CreateUserRequest", CreateUserSchema);
registry.register("UpdateUserRequest", UpdateUserSchema);
registry.register("LoginRequest", LoginSchema);
registry.register("LoginResponse", LoginResponseSchema);
registry.register("Model", ModelSchema);
registry.register("CreateModelRequest", CreateModelSchema);
registry.register("UpdateModelRequest", UpdateModelSchema);
registry.register("ErrorResponse", ErrorResponseSchema);
registry.register("SuccessResponse", SuccessResponseSchema);

// ============================================================================
// Auth Routes
// ============================================================================

registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  tags: ["Authentication"],
  summary: "Register a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User created successfully",
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["Authentication"],
  summary: "Login user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: LoginResponseSchema,
        },
      },
    },
    401: {
      description: "Invalid credentials",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// ============================================================================
// User Routes
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/api/users",
  tags: ["Users"],
  summary: "Get all users",
  responses: {
    200: {
      description: "List of users",
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(UserSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/{id}",
  tags: ["Users"],
  summary: "Get user by ID",
  request: {
    params: PathIdSchema,
  },
  responses: {
    200: {
      description: "User found",
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/users/{id}",
  tags: ["Users"],
  summary: "Update user",
  request: {
    params: PathIdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User updated",
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/users/{id}",
  tags: ["Users"],
  summary: "Delete user",
  request: {
    params: PathIdSchema,
  },
  responses: {
    200: {
      description: "User deleted",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// ============================================================================
// Model Routes
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/api/models",
  tags: ["Models"],
  summary: "Get all models",
  responses: {
    200: {
      description: "List of models",
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(ModelSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/models",
  tags: ["Models"],
  summary: "Upload a new model",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateModelSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Model created",
      content: {
        "application/json": {
          schema: ModelSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/models/{id}",
  tags: ["Models"],
  summary: "Get model by ID",
  request: {
    params: PathIdSchema,
  },
  responses: {
    200: {
      description: "Model found",
      content: {
        "application/json": {
          schema: ModelSchema,
        },
      },
    },
    404: {
      description: "Model not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/models/{id}",
  tags: ["Models"],
  summary: "Update model",
  request: {
    params: PathIdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateModelSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Model updated",
      content: {
        "application/json": {
          schema: ModelSchema,
        },
      },
    },
    404: {
      description: "Model not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/models/{id}",
  tags: ["Models"],
  summary: "Delete model",
  request: {
    params: PathIdSchema,
  },
  responses: {
    200: {
      description: "Model deleted",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    404: {
      description: "Model not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// ============================================================================
// Generate OpenAPI Document
// ============================================================================

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "3D Model Viewer API",
      version: "1.0.0",
      description: "API for managing 3D models and user authentication",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
  });
}

export default registry;
