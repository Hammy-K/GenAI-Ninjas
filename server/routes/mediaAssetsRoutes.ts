import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create upload directory if it doesn't exist
const UPLOAD_DIR = path.join(__dirname, "../uploaded_media_assets");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({ storage, fileFilter });

// Upload image
router.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

// Get list of all uploaded images
router.get("/list", (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const imageFiles = files.map((filename) => {
      const filePath = path.join(UPLOAD_DIR, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        uploadedAt: stats.birthtime,
      };
    });

    res.json({ images: imageFiles });
  } catch (error) {
    res.status(500).json({ error: "Failed to list images" });
  }
});

// Download/serve image
router.get("/download/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({ error: "Download failed" });
  }
});

// Get image for preview
router.get("/view/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: "Failed to load image" });
  }
});

// Delete image
router.delete("/delete/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
