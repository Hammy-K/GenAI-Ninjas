import React, { useState, useEffect } from "react";
import axios from "axios";

interface MediaAssetItem {
  filename: string;
  size: number;
  uploadedAt: string;
}

const MediaAssetsControl: React.FC = () => {
  const [mediaAssets, setMediaAssets] = useState<MediaAssetItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const API_BASE = "/api/media-assets";

  useEffect(() => {
    fetchMediaAssets();
  }, []);

  const fetchMediaAssets = async () => {
    try {
      const response = await axios.get(`${API_BASE}/list`);
      setMediaAssets(response.data.images);
    } catch (error) {
      console.error("Failed to fetch media assets:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    setUploading(true);
    try {
      await axios.post(`${API_BASE}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("File uploaded successfully!");
      setSelectedFile(null);
      fetchMediaAssets();

      // Reset file input
      const fileInput = document.getElementById(
        "fileInput",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      setMessage("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/delete/${filename}`);
      setMessage("File deleted successfully!");
      fetchMediaAssets();
    } catch (error) {
      setMessage("Failed to delete file.");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Media Assets Control Panel</h1>

      {/* Upload Section */}
      <div style={styles.uploadSection}>
        <h2 style={styles.sectionTitle}>Upload New Image</h2>
        <div style={styles.uploadBox}>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={styles.fileInput}
          />
          {selectedFile && (
            <p style={styles.selectedFile}>Selected: {selectedFile.name}</p>
          )}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{
              ...styles.uploadButton,
              ...((!selectedFile || uploading) && styles.uploadButtonDisabled),
            }}
          >
            {uploading ? "Uploading..." : "Upload Image"}
          </button>
        </div>
        {message && <p style={styles.message}>{message}</p>}
      </div>

      {/* Images List Section */}
      <div style={styles.listSection}>
        <h2 style={styles.sectionTitle}>
          Uploaded Images ({mediaAssets.length})
        </h2>
        {mediaAssets.length === 0 ? (
          <p style={styles.emptyMessage}>No images uploaded yet.</p>
        ) : (
          <div style={styles.grid}>
            {mediaAssets.map((asset) => (
              <div key={asset.filename} style={styles.card}>
                <img
                  src={`${API_BASE}/view/${asset.filename}`}
                  alt={asset.filename}
                  style={styles.thumbnail}
                />
                <div style={styles.cardInfo}>
                  <p style={styles.filename}>{asset.filename}</p>
                  <p style={styles.fileDetails}>
                    Size: {formatFileSize(asset.size)}
                  </p>
                  <p style={styles.fileDetails}>
                    Uploaded: {new Date(asset.uploadedAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => handleDelete(asset.filename)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "30px",
    color: "#333",
  },
  uploadSection: {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "30px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "15px",
    color: "#555",
  },
  uploadBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  fileInput: {
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
  },
  selectedFile: {
    fontSize: "14px",
    color: "#666",
    margin: "0",
  },
  uploadButton: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#007bff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  uploadButtonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  message: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#28a745",
    fontWeight: "bold",
  },
  listSection: {
    marginTop: "30px",
  },
  emptyMessage: {
    fontSize: "16px",
    color: "#999",
    textAlign: "center",
    padding: "40px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  thumbnail: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
  },
  cardInfo: {
    padding: "15px",
  },
  filename: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "5px",
    wordBreak: "break-word",
  },
  fileDetails: {
    fontSize: "12px",
    color: "#666",
    margin: "3px 0",
  },
  deleteButton: {
    marginTop: "10px",
    padding: "8px 16px",
    fontSize: "14px",
    color: "#fff",
    backgroundColor: "#dc3545",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    width: "100%",
    transition: "background-color 0.3s",
  },
};

export default MediaAssetsControl;
