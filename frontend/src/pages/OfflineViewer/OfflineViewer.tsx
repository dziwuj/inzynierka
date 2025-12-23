import { type FC, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./OfflineViewer.module.scss";

import Logo from "@/assets/icons/logo.svg";

const ALLOWED_EXTENSIONS = [".gltf", ".glb", ".fbx", ".obj", ".stl", ".ply"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const OfflineViewer: FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const validateFile = (file: File): string | null => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Invalid file format. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    // Read file as data URL and navigate to viewer with it
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Navigate to offline model viewer with data URL
      navigate("/offline/view", {
        state: { modelData: dataUrl, fileName: file.name },
      });
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleReturnToLogin = () => {
    navigate("/");
  };

  const SUPPORTED_FORMATS = [
    { name: "GLTF", extension: ".gltf", description: "GL Transmission Format" },
    { name: "GLB", extension: ".glb", description: "Binary GLTF" },
    { name: "FBX", extension: ".fbx", description: "Autodesk FBX" },
    { name: "OBJ", extension: ".obj", description: "Wavefront OBJ" },
    { name: "STL", extension: ".stl", description: "Stereolithography" },
    { name: "PLY", extension: ".ply", description: "Polygon File Format" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <img src={Logo} alt="3D Model Viewer Logo" />
          </div>
          <h1 className={styles.title}>3D Model Viewer</h1>
        </div>
        <button className={styles.returnButton} onClick={handleReturnToLogin}>
          Return to Login
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Welcome to Offline Mode</h1>
          <p className={styles.heroSubtitle}>
            Select a 3D model file from your device to view it instantly. Your
            files stay private and are never uploaded.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(",")}
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />

          <div className={styles.actions}>
            <button
              className={styles.selectButton}
              onClick={() => fileInputRef.current?.click()}>
              Select 3D Model File
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.formatsSection}>
          <h3 className={styles.formatsTitle}>Supported Formats</h3>
          <div className={styles.formatsGrid}>
            {SUPPORTED_FORMATS.map(format => (
              <div key={format.extension} className={styles.formatCard}>
                <div className={styles.formatThumbnail}>
                  <span className={styles.formatName}>{format.name}</span>
                </div>
                <div className={styles.formatContent}>
                  <p className={styles.formatExtension}>{format.extension}</p>
                  <p className={styles.formatDescription}>
                    {format.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.info}>
          <p>
            <strong>Note:</strong> Your file is not uploaded anywhere. It stays
            on your device and is viewed directly in your browser.
          </p>
        </div>
      </div>
    </div>
  );
};
