import axios from "axios";

export const fetchVideos = async () => {
  const res = await axios.get("/api/google-drive/videos");

  return res.data;
};

export const fetchVideoEmbedUrl = async (fileId: string) => {
  const res = await axios.get(`/api/google-drive/videos/${fileId}`);

  return res.data.embedUrl;
};
