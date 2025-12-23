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
        {model.thumbnailUrl ? (
          <img src={model.thumbnailUrl} alt={model.name} />
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
