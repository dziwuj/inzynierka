import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useStores } from "@stores/useStores";
import { generateThumbnail } from "@utils/thumbnailGenerator";
import { observer } from "mobx-react";

import styles from "./UploadModal.module.scss";

interface UploadModalProps {
  onClose: () => void;
  onUploadComplete: (modelId?: string) => void;
}

const ALLOWED_EXTENSIONS = [".gltf", ".glb", ".obj", ".stl", ".ply"];
const ALLOWED_ASSET_EXTENSIONS = [
  ".bin",
  ".mtl",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".ktx2",
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file (Vercel Blob limit)
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total for all files

const UploadModal = observer(
  ({ onClose, onUploadComplete }: UploadModalProps) => {
    const { modelsStore, authStore } = useStores();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [modelName, setModelName] = useState("");
    const [error, setError] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const validateFiles = (files: File[]): string | null => {
      if (files.length === 0) {
        return "No files selected";
      }

      // Find the main model file
      const mainModelFile = files.find(file => {
        const extension = "." + file.name.split(".").pop()?.toLowerCase();
        return ALLOWED_EXTENSIONS.includes(extension);
      });

      if (!mainModelFile) {
        return `No valid model file found. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
      }

      // Check individual file sizes
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          return `File ${file.name} is too large. Maximum size per file: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
        }
      }

      // Check total size
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        return `Total size too large (${(totalSize / (1024 * 1024)).toFixed(2)}MB). Maximum: ${MAX_TOTAL_SIZE / (1024 * 1024)}MB`;
      }

      // Validate asset files if present
      for (const file of files) {
        const extension = "." + file.name.split(".").pop()?.toLowerCase();
        if (
          !ALLOWED_EXTENSIONS.includes(extension) &&
          !ALLOWED_ASSET_EXTENSIONS.includes(extension)
        ) {
          return `File ${file.name} has unsupported format. Allowed: ${[...ALLOWED_EXTENSIONS, ...ALLOWED_ASSET_EXTENSIONS].join(", ")}`;
        }
      }

      return null;
    };

    const handleFilesSelect = (files: FileList | File[]) => {
      let fileArray = Array.from(files);

      // Filter to only supported files (model files and assets) - ignore files like license.txt
      const isRelevantFile = (fileName: string) => {
        const ext = "." + fileName.split(".").pop()?.toLowerCase();
        return (
          ALLOWED_EXTENSIONS.includes(ext) ||
          ALLOWED_ASSET_EXTENSIONS.includes(ext)
        );
      };

      fileArray = fileArray.filter(file => isRelevantFile(file.name));

      if (fileArray.length === 0) {
        setError("No supported model or asset files found in selection");
        setSelectedFiles([]);
        return;
      }

      const validationError = validateFiles(fileArray);

      if (validationError) {
        setError(validationError);
        setSelectedFiles([]);
        return;
      }

      setError("");
      setSelectedFiles(fileArray);

      if (!modelName) {
        // For folder uploads, use folder name if available
        if (fileArray.length > 0 && fileArray[0].webkitRelativePath) {
          // Extract folder name from the first file's path
          const pathParts = fileArray[0].webkitRelativePath.split("/");
          if (pathParts.length > 1) {
            // Use the top-level folder name
            setModelName(pathParts[0]);
            return;
          }
        }

        // Fallback: Find the main model file to extract name (without extension)
        const mainFile = fileArray.find(file => {
          const ext = "." + file.name.split(".").pop()?.toLowerCase();
          return ALLOWED_EXTENSIONS.includes(ext);
        });

        if (mainFile) {
          const lastDotIndex = mainFile.name.lastIndexOf(".");
          const nameWithoutExt =
            lastDotIndex > 0
              ? mainFile.name.substring(0, lastDotIndex)
              : mainFile.name;
          setModelName(nameWithoutExt);
        }
      }
    };

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFilesSelect(files);
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

      const items = e.dataTransfer.items;
      const files: File[] = [];

      if (items) {
        // Handle folder/file drop with DataTransferItemList
        const promises: Promise<void>[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const entry = item.webkitGetAsEntry?.();
            if (entry) {
              promises.push(collectFiles(entry, files));
            } else {
              const file = item.getAsFile();
              if (file) files.push(file);
            }
          }
        }

        Promise.all(promises).then(() => {
          if (files.length > 0) {
            handleFilesSelect(files);
          }
        });
      } else {
        // Fallback to file list
        const fileList = e.dataTransfer.files;
        if (fileList.length > 0) {
          handleFilesSelect(fileList);
        }
      }
    };

    // Helper function to recursively collect files from folders
    const collectFiles = async (
      entry: FileSystemEntry,
      files: File[],
    ): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        return new Promise(resolve => {
          fileEntry.file((file: File) => {
            files.push(file);
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();
        return new Promise(resolve => {
          dirReader.readEntries(async (entries: FileSystemEntry[]) => {
            for (const childEntry of entries) {
              await collectFiles(childEntry, files);
            }
            resolve();
          });
        });
      }
    };

    const handleUpload = async () => {
      if (selectedFiles.length === 0 || !modelName.trim()) {
        setError("Please select files and provide a model name");
        return;
      }

      try {
        // Generate thumbnail from main model file (pass all files for GLTF with external resources)
        let thumbnail: Blob | null = null;
        const mainFile = selectedFiles.find(file => {
          const ext = "." + file.name.split(".").pop()?.toLowerCase();
          return ALLOWED_EXTENSIONS.includes(ext);
        });

        if (mainFile) {
          thumbnail = await generateThumbnail(selectedFiles);
        }

        if (authStore.isOfflineMode) {
          await modelsStore.uploadOfflineModel(selectedFiles, modelName.trim());
          // Get the model ID that was just created (offline models only have one at a time)
          const uploadedModelId = modelsStore.models[0]?.id;
          onUploadComplete(uploadedModelId);
        } else {
          await modelsStore.uploadModel(
            selectedFiles,
            modelName.trim(),
            thumbnail,
          );
          onUploadComplete();
        }
      } catch (err) {
        console.error("Upload error:", err);
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
              className={`${styles.dropZone} ${isDragging ? styles.dragging : ""} ${selectedFiles.length > 0 ? styles.hasFile : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}>
              {selectedFiles.length > 0 ? (
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>
                    {selectedFiles.length === 1
                      ? selectedFiles[0].name
                      : `${selectedFiles.length} files selected`}
                  </div>
                  <div className={styles.fileSize}>
                    {(
                      selectedFiles.reduce((sum, f) => sum + f.size, 0) /
                      (1024 * 1024)
                    ).toFixed(2)}{" "}
                    MB total
                  </div>
                  {selectedFiles.length > 1 && (
                    <div className={styles.fileList}>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className={styles.fileItem}>
                          • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.dropZoneContent}>
                  <div className={styles.uploadIcon}>📁</div>
                  <p className={styles.dropText}>
                    Drag and drop your 3D model or folder here
                  </p>
                  <p className={styles.orText}>or</p>
                  <div className={styles.buttonGroup}>
                    <button
                      type="button"
                      className={styles.browseButton}
                      onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </button>
                    <button
                      type="button"
                      className={styles.browseButton}
                      onClick={() => folderInputRef.current?.click()}>
                      Select Folder
                    </button>
                  </div>
                  <p className={styles.formatHint}>
                    Supported: {ALLOWED_EXTENSIONS.join(", ")}
                    <br />
                    Assets: {ALLOWED_ASSET_EXTENSIONS.join(", ")}
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={[
                  ...ALLOWED_EXTENSIONS,
                  ...ALLOWED_ASSET_EXTENSIONS,
                ].join(",")}
                multiple
                onChange={handleFileInputChange}
                className={styles.fileInput}
              />
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error - webkitdirectory is not in standard TypeScript types
                webkitdirectory=""
                onChange={handleFileInputChange}
                className={styles.fileInput}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {!authStore.isOfflineMode && (
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
            )}
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
                selectedFiles.length === 0 ||
                (!authStore.isOfflineMode && !modelName.trim()) ||
                modelsStore.isUploading
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
