import { Router } from "express";
import { handleLovableChat } from "./lovable.handler";
import { registerLovableSubmissionsRoutes } from "./lovable-submissions/lovable-submissions.route";

export function registerLovableRoutes(router: Router): void {
  const r = Router();

  r.post("/chat", handleLovableChat);

  registerLovableSubmissionsRoutes(r);

  router.use("/genai/lovable", r);
}
