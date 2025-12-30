import { useEffect, useState } from "react";
import { rootStore } from "@stores/Root.store";
import { Link } from "react-router-dom";

import styles from "./ModelCard.module.scss";

export interface Model {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  fileFormat: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ModelCardProps {
  model: Model;
  onDelete: () => void;
}

const ModelCard = ({ model, onDelete }: ModelCardProps) => {
  const [thumbnailBlobUrl, setThumbnailBlobUrl] = useState<string | null>(null);

  // Fetch thumbnail with auth headers and convert to blob URL
  useEffect(() => {
    if (!model.thumbnailUrl) return;

    let isMounted = true;

    const fetchThumbnail = async () => {
      try {
        const token = rootStore.authStore.accessToken;
        const thumbnailUrl = model.thumbnailUrl!; // Assert non-null since we checked above

        // Check if thumbnailUrl is already a complete URL (from Vercel Blob)
        const isExternalUrl = thumbnailUrl.startsWith("http");
        const thumbnailFetchUrl = isExternalUrl
          ? thumbnailUrl
          : `${import.meta.env.VITE_API_URL}${thumbnailUrl}`;

        const response = await fetch(thumbnailFetchUrl, {
          headers: isExternalUrl
            ? {} // No auth needed for public Blob URLs
            : {
                Authorization: `Bearer ${token}`,
              },
          credentials: isExternalUrl ? "omit" : "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch thumbnail: ${response.status}`);
        }

        const blob = await response.blob();

        if (isMounted) {
          const blobUrl = URL.createObjectURL(blob);
          setThumbnailBlobUrl(blobUrl);
        }
      } catch (error) {
        console.error("Failed to fetch thumbnail:", error);
      }
    };

    fetchThumbnail();

    return () => {
      isMounted = false;
      if (thumbnailBlobUrl) {
        URL.revokeObjectURL(thumbnailBlobUrl);
      }
    };
  }, [model.thumbnailUrl]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className={styles.modelCard}>
      <Link to={`/viewer/${model.id}`} className={styles.thumbnail}>
        {thumbnailBlobUrl ? (
          <img src={thumbnailBlobUrl} alt={model.name} />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.fileFormat}>{model.fileFormat}</span>
          </div>
        )}
      </Link>

      <div className={styles.content}>
        <Link to={`/viewer/${model.id}`} className={styles.name}>
          {model.name}
        </Link>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Size:</span>{" "}
            {formatFileSize(model.fileSize)}
          </span>
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Uploaded:</span>{" "}
            {formatDate(model.createdAt)}
          </span>
        </div>

        <div className={styles.actions}>
          <Link to={`/viewer/${model.id}`} className={styles.viewButton}>
            View
          </Link>
          <button onClick={handleDeleteClick} className={styles.deleteButton}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelCard;
