import { Router } from "express";
import { handleImageGeneration } from "./image-generation.handler";

export function registerImageGenerationRoutes(router: Router): void {
  const imageGenerationRouter = Router();

  imageGenerationRouter.post("/", handleImageGeneration);

  router.use("/image-generation", imageGenerationRouter);
}
