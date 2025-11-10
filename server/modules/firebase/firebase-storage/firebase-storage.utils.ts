export function buildPublicUrl(bucketName: string, destPath: string) {
  return `https://storage.googleapis.com/${bucketName}/${encodeURI(destPath)}`;
}
