import cors from "cors";
import express from "express";

import pool from "./db";
import { generateOpenApiDocument } from "./openapi";
import { authRoutes, modelRoutes, userRoutes } from "./routes";

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Middleware
// ============================================================================

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CORS_ORIGIN || "https://localhost:5173")
        .split(",")
        .map(o => o.trim());
      
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed pattern (supports wildcards)
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed.includes("*")) {
          const pattern = new RegExp("^" + allowed.replace(/\*/g, ".*") + "$");
          return pattern.test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ============================================================================
// Health Check
// ============================================================================

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================================================
// OpenAPI Documentation
// ============================================================================

app.get("/api/docs", (req, res) => {
  const openApiDoc = generateOpenApiDocument();
  res.json(openApiDoc);
});

app.get("/api/docs/swagger", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Documentation</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/api/docs',
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
          });
        </script>
      </body>
    </html>
  `);
});

// ============================================================================
// Routes
// ============================================================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/models", modelRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "3D Model Viewer API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      docs: "/api/docs",
      swagger: "/api/docs/swagger",
      auth: "/api/auth",
      users: "/api/users",
      models: "/api/models",
    },
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `📚 API Documentation: http://localhost:${PORT}/api/docs/swagger`,
  );
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
