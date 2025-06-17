import { Router, Request, Response } from "express";
import claude4Handler from "../controller/claude-4.controller";

export function registerHtmlAiRoute(router: Router) {
  const htmlAiRoutes = Router();

  htmlAiRoutes.post("/openai", async (req: Request, res: Response) => {});

  htmlAiRoutes.post(
    "/anthropic/claude-3.7",
    async (req: Request, res: Response) => {},
  );

  htmlAiRoutes.post("/anthropic/claude-4", claude4Handler);

  htmlAiRoutes.post(
    "/anthropic/claude-3.7-4",
    async (req: Request, res: Response) => {},
  );

  router.use("/html-ai", htmlAiRoutes);
}
