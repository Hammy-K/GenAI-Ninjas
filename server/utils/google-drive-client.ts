import { google } from "googleapis";

// Use environment variable for credentials instead of file
const serviceAccountJson = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;

let auth: any = null;

if (serviceAccountJson) {
  try {
    const credentials = JSON.parse(serviceAccountJson);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  } catch (error) {
    console.error('Failed to parse Google Drive service account JSON:', error);
  }
} else {
  console.warn('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON not found - Google Drive features disabled');
}

export const drive = auth ? google.drive({ version: "v3", auth }) : null;
