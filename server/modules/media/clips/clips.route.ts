import { Router } from "express";
import { ClipsController, upload } from "./clips.controller";

export function registerMediaClipsRoutes(router: Router) {
  const r = Router();

  r.post("/upload", upload.single("file"), ClipsController.createViaUpload);

  r.get("/", ClipsController.list);

  r.get("/by-email", ClipsController.findByEmail);

  r.get("/:id", ClipsController.findById);

  r.delete("/:id", ClipsController.remove);

  router.use("/media/clips", r);
}
