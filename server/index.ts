import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { CONFIG } from "./config";
import { setupVite, serveStatic, log } from "./vite";
import { seedAppBuilderSteps } from "./scripts/seed-app-builder-steps";
import "./modules/video-jobs/video-jobs.worker";

// Process-level error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS - Allow external requests to POST submissions
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Trust proxy headers from Replit
app.set("trust proxy", 1);

// Session configuration with Postgres-backed storage
const sessionStore = new (pgSession(session))({
  pool: pool, // reuse the Neon connection pool
  tableName: "sessions", // connect-pg-simple will create this table
});

app.use(
  session({
    store: sessionStore,
    secret: CONFIG.auth.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: CONFIG.environment.isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
  }),
);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Initialize server
(async () => {
  // Seed database
  try {
    await seedAppBuilderSteps();
    log("Successfully seeded App Builder steps");
  } catch (error) {
    console.error("Failed to seed App Builder steps:", error);
  }

  // Serve generated videos
  app.use(
    "/generated-videos",
    express.static("server/public/generated-videos", {
      setHeaders: (res, path) => {
        if (path.endsWith(".mp4")) {
          res.setHeader("Content-Type", "video/mp4");
          res.setHeader("Content-Disposition", "inline");
        }
      },
    }),
  );

  // Register all routes
  const server = await registerRoutes(app);

  // Note: Global error handler is now registered in routes.ts

  // Setup Vite in development or serve static in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
