import React, { useState, useEffect } from "react";
import axios from "axios";

interface MediaAssetItem {
  filename: string;
  size: number;
  uploadedAt: string;
}

const MediaAssetsGallery: React.FC = () => {
  const [mediaAssets, setMediaAssets] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filename: string) => {
    window.open(`${API_BASE}/download/${filename}`, "_blank");
  };

  const handleImageClick = (filename: string) => {
    setSelectedImage(filename);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Loading gallery...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>معرض الصور</h1>
      <p style={styles.subtitle}>اختر المنتج الي ودك تعلن عنه وحمل صورته</p>

      {mediaAssets.length === 0 ? (
        <p style={styles.emptyMessage}>No images available yet.</p>
      ) : (
        <div style={styles.grid}>
          {mediaAssets.map((asset) => (
            <div key={asset.filename} style={styles.card}>
              <div
                style={styles.imageContainer}
                onClick={() => handleImageClick(asset.filename)}
              >
                <img
                  src={`${API_BASE}/view/${asset.filename}`}
                  alt={asset.filename}
                  style={styles.image}
                />
                <div style={styles.overlay}>
                  <span style={styles.overlayText}>Click to view</span>
                </div>
              </div>
              <div style={styles.cardInfo}>
                <p style={styles.filename}>{asset.filename}</p>
                <p style={styles.fileDetails}>
                  Size: {formatFileSize(asset.size)}
                </p>
                <button
                  onClick={() => handleDownload(asset.filename)}
                  style={styles.downloadButton}
                >
                  تحميل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={closeModal}>
              ×
            </button>
            <img
              src={`${API_BASE}/view/${selectedImage}`}
              alt={selectedImage}
              style={styles.modalImage}
            />
            <p style={styles.modalFilename}>{selectedImage}</p>
            <button
              onClick={() => handleDownload(selectedImage)}
              style={styles.modalDownloadButton}
            >
              Download Image
            </button>
          </div>
        </div>
      )}
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
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    textAlign: "center",
    marginBottom: "40px",
  },
  loading: {
    fontSize: "18px",
    color: "#666",
    textAlign: "center",
    padding: "60px",
  },
  emptyMessage: {
    fontSize: "18px",
    color: "#999",
    textAlign: "center",
    padding: "60px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
    marginTop: "20px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    transition: "transform 0.3s, box-shadow 0.3s",
    cursor: "pointer",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: "220px",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.3s",
  },
  overlayText: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
  },
  cardInfo: {
    padding: "16px",
  },
  filename: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
    wordBreak: "break-word",
  },
  fileDetails: {
    fontSize: "12px",
    color: "#888",
    marginBottom: "12px",
  },
  downloadButton: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#28a745",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    position: "relative",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "12px",
    maxWidth: "90%",
    maxHeight: "90%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    fontSize: "32px",
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalImage: {
    maxWidth: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
    marginBottom: "20px",
  },
  modalFilename: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "15px",
  },
  modalDownloadButton: {
    padding: "12px 32px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#28a745",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
};

export default MediaAssetsGallery;
