import { type FC, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router-dom";

import { UploadModal } from "@/components";

import styles from "./OfflineViewer.module.scss";

import Logo from "@/assets/icons/logo.svg";

export const OfflineViewer: FC = observer(() => {
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleReturnToLogin = () => {
    navigate("/");
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = (modelId?: string) => {
    setIsUploadModalOpen(false);
    // Navigate to offline viewer to display the uploaded model
    if (modelId) {
      // Just navigate with the ID - the viewer will get the model from the store
      navigate(`/offline/view/${modelId}`);
    }
  };

  const SUPPORTED_FORMATS = [
    { name: "GLTF", extension: ".gltf", description: "GL Transmission Format" },
    { name: "GLB", extension: ".glb", description: "Binary GLTF" },
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
            View 3D models directly in your browser. Your files stay private and
            are never uploaded.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.uploadButton}
              onClick={handleUploadClick}>
              Upload Model
            </button>
          </div>
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
            <strong>🔒 Privacy:</strong> Your files are not uploaded anywhere.
            They stay on your device and are viewed directly in your browser.
          </p>
        </div>
      </div>

      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
});
