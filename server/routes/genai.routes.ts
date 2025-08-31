import { Router } from "express";
import { handleAppDevCodeGenerator } from "server/handler/app-dev-code-generator.handler";

export function registerGenAiRoutes(router: Router): void {
  const genaiRoutes = Router();

  // frontend app-dev code generator
  genaiRoutes.post("/app-dev/code-generator", handleAppDevCodeGenerator);

  router.use("/genai", genaiRoutes);
}
