import "./config/passport"; // Initialize passport configuration

import cors from "cors";
import express from "express";
import fs from "fs";
import https from "https";
import passport from "passport";
import path from "path";

import pool from "./db";
import { generateOpenApiDocument } from "./openapi";
import { authRoutes, modelRoutes } from "./routes";

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Middleware
// ============================================================================

const allowedOrigins = [
  "https://3d-model-viewer.dziwuj.dev",
  "https://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
];

// Add FRONTEND_URL from environment if set
if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(",").map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or curl)
      if (!origin) return callback(null, true);

      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(
          `CORS warning: Origin ${origin} not in allowed list: ${allowedOrigins.join(", ")}`,
        );
        // Allow anyway to prevent blocking in production
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

// Body parsers - skip for file upload routes
app.use((req, res, next) => {
  // Skip body parsing for file upload endpoints
  if (req.path.startsWith("/api/models") && req.method === "POST") {
    return next();
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(passport.initialize());

// Handle preflight requests for all routes
app.options("*", cors());

// ============================================================================
// Health Check
// ============================================================================

app.get("/api/health", async (req, res) => {
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
app.use("/api/models", modelRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "3D Model Viewer API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      docs: "/api/docs",
      swagger: "/api/docs/swagger",
      auth: "/api/auth",
      models: "/api/models",
    },
  });
});

// ============================================================================
// 404 Handler
// ============================================================================

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  },
);

// ============================================================================
// Start Server
// ============================================================================

// Check for SSL certificates (shared certs directory)
const certPath = path.resolve(__dirname, "../../certs/localhost.pem");
const keyPath = path.resolve(__dirname, "../../certs/localhost-key.pem");
const useHttps = fs.existsSync(certPath) && fs.existsSync(keyPath);

if (useHttps) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🔒 Server running on https://localhost:${PORT}`);
    console.log(
      `📚 API Documentation: https://localhost:${PORT}/api/docs/swagger`,
    );
    console.log(`🏥 Health check: https://localhost:${PORT}/health`);
  });
} else {
  app.listen(PORT, () => {
    console.log(
      `⚠️  Server running on http://localhost:${PORT} (no SSL certificates found)`,
    );
    console.log(
      `📚 API Documentation: http://localhost:${PORT}/api/docs/swagger`,
    );
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });
}
