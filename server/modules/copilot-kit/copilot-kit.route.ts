import { Router } from "express";
import { COPILOT_ENDPOINT } from "./copilot-kit.config";
import {
  // createCopilotHealthHandler,
  createCopilotPostHandler,
} from "./copilot-kit.handler";

/**
 * Register Copilot routes onto the given router (your convention).
 * Will mount:
 *   POST   /copilotkit   ← main runtime endpoint
 *   GET    /copilotkit   ← health (optional)
 */
export function registerCopilotRoutes(apiRouter: Router) {
  const router = Router();

  // router.get(COPILOT_ENDPOINT, createCopilotHealthHandler());
  router.post(COPILOT_ENDPOINT, createCopilotPostHandler());

  // mount into the provided router without adding extra path segments
  apiRouter.use(router);
}
