import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      ...serverOptions,
      allowedHosts: true, // Add this here explicitly
    },
    appType: "custom",
  });

  // IMPORTANT: Only apply Vite middlewares to non-API routes
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    vite.middlewares(req, res, next);
  });

  app.use("*", async (req, res, next) => {
    // Skip API routes
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files but skip /api routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    express.static(distPath)(req, res, next);
  });

  // Fall through to index.html ONLY for non-API routes
  app.use("*", (req, res, next) => {
    // Skip API routes - let them 404 properly
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
