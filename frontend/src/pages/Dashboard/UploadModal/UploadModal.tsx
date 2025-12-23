import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { observer } from "mobx-react";

import { useStores } from "../../../stores/useStores";

import styles from "./UploadModal.module.scss";

interface UploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

const ALLOWED_EXTENSIONS = [".gltf", ".glb", ".fbx", ".obj", ".stl", ".ply"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const UploadModal = observer(
  ({ onClose, onUploadComplete }: UploadModalProps) => {
    const { modelsStore, authStore } = useStores();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [modelName, setModelName] = useState("");
    const [error, setError] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileSelect = (file: File) => {
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }

      setError("");
      setSelectedFile(file);

      if (!modelName) {
        const nameWithoutExt = file.name.substring(
          0,
          file.name.lastIndexOf("."),
        );
        setModelName(nameWithoutExt);
      }
    };

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    };

    const handleUpload = async () => {
      if (!selectedFile || !modelName.trim()) {
        setError("Please select a file and provide a model name");
        return;
      }

      try {
        if (authStore.isOfflineMode) {
          await modelsStore.uploadOfflineModel(selectedFile, modelName.trim());
        } else {
          await modelsStore.uploadModel(selectedFile, modelName.trim());
        }
        onUploadComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h2 className={styles.title}>Upload 3D Model</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>

          <div className={styles.content}>
            <div
              className={`${styles.dropZone} ${isDragging ? styles.dragging : ""} ${selectedFile ? styles.hasFile : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}>
              {selectedFile ? (
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{selectedFile.name}</div>
                  <div className={styles.fileSize}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              ) : (
                <div className={styles.dropZoneContent}>
                  <div className={styles.uploadIcon}>📁</div>
                  <p className={styles.dropText}>
                    Drag and drop your 3D model here
                  </p>
                  <p className={styles.orText}>or</p>
                  <button type="button" className={styles.browseButton}>
                    Browse Files
                  </button>
                  <p className={styles.formatHint}>
                    Supported formats: {ALLOWED_EXTENSIONS.join(", ")}
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(",")}
                onChange={handleFileInputChange}
                className={styles.fileInput}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
              <label htmlFor="modelName" className={styles.label}>
                Model Name
              </label>
              <input
                id="modelName"
                type="text"
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                className={styles.input}
                placeholder="Enter model name"
                maxLength={100}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={modelsStore.isUploading}>
              Cancel
            </button>
            <button
              className={styles.uploadButton}
              onClick={handleUpload}
              disabled={
                !selectedFile || !modelName.trim() || modelsStore.isUploading
              }>
              {modelsStore.isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

export default UploadModal;
