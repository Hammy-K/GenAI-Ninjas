import { Request, Response } from "express";
import {
  getVideoEmbedUrl,
  listVideosInFolder,
} from "server/services/google/drive.service";

const GOOGLE_DRIVE_FOLDER_ID = "1_I2ZxWw2P_IxdoKVUUFF5XhSvJdBieoc";

export const handleGetVideos = async (req: Request, res: Response) => {
  try {
    const videos = await listVideosInFolder(GOOGLE_DRIVE_FOLDER_ID);

    const enrichedVideos = videos.map((video) => ({
      ...video,
      embedUrl: getVideoEmbedUrl(video.id ?? ""),
    }));

    res.json(enrichedVideos);
  } catch (error) {
    console.error("Error fetching videos:", error);

    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

export const handleGetVideoEmbedUrl = (req: Request, res: Response) => {
  const fileId = req.params.fileId;

  if (!fileId) {
    return res.status(400).json({ error: "Missing fileId" });
  }

  const embedUrl = getVideoEmbedUrl(fileId);

  res.json({ embedUrl });
};
