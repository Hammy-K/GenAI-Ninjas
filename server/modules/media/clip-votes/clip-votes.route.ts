import { Router } from "express";
import { ClipVotesController } from "./clip-votes.controller";

export function registerMediaClipVotesRoutes(router: Router) {
  const r = Router();

  r.post("/:id/votes", (req, res) => ClipVotesController.toggle(req, res));

  // r.get("/:id/votes", (req, res) => ClipVotesController.counts(req, res));

  router.use("/media/clips", r);
}
