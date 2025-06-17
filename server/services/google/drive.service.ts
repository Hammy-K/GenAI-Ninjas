import { drive } from "server/utils/google-drive-client";

export const listVideosInFolder = async (folderId: string) => {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
    fields: "files(id, name, mimeType, size, thumbnailLink)",
  });

  return res.data.files || [];
};

export const getVideoEmbedUrl = (fileId: string) => {
  return `https://drive.google.com/file/d/${fileId}/preview`;
};
