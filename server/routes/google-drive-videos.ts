import { Router } from "express";
import {
  handleGetVideoEmbedUrl,
  handleGetVideos,
} from "server/controller/google-drive-videos.controller";

export const registerGoogleDriveVideosRoutes = (router: Router) => {
  const googleDriveVideosRoutes = Router();

  googleDriveVideosRoutes.get("/videos", handleGetVideos);

  googleDriveVideosRoutes.get("/videos/:fileId", handleGetVideoEmbedUrl);

  router.use("/google-drive", googleDriveVideosRoutes);
};
