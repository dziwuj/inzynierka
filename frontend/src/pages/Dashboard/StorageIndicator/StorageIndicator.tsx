import styles from "./StorageIndicator.module.scss";

interface StorageIndicatorProps {
  usedBytes: number;
  maxBytes: number;
  modelCount: number;
}

const StorageIndicator = ({
  usedBytes,
  maxBytes,
  modelCount,
}: StorageIndicatorProps) => {
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
  const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
  const percentage = Math.min((usedBytes / maxBytes) * 100, 100);

  const getStatusClass = () => {
    if (percentage >= 90) return styles.danger;
    if (percentage >= 75) return styles.warning;
    return styles.normal;
  };

  return (
    <div className={styles.storageIndicator}>
      <div className={styles.info}>
        <div className={styles.stats}>
          <span className={styles.label}>Storage Usage</span>
          <span className={styles.value}>
            {usedMB} MB / {maxMB} MB
          </span>
        </div>
        <div className={styles.models}>
          <span className={styles.count}>{modelCount}</span> model
          {modelCount !== 1 ? "s" : ""}
        </div>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${getStatusClass()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
};

export default StorageIndicator;
