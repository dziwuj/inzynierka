import { useStores } from "@stores/useStores";
import { observer } from "mobx-react";

import { ModelCard, StorageIndicator } from "@/components";

import styles from "./ModelsDashboard.module.scss";

interface ModelsDashboardProps {
  onUploadClick: () => void;
}

const ModelsDashboard = observer(({ onUploadClick }: ModelsDashboardProps) => {
  const { modelsStore } = useStores();

  const handleDeleteModel = async (modelId: string) => {
    if (confirm("Are you sure you want to delete this model?")) {
      try {
        // Check if it's an offline temporary model by ID format
        if (modelId.startsWith("offline-")) {
          modelsStore.deleteOfflineModel();
        } else {
          await modelsStore.deleteModel(modelId);
        }
      } catch (error) {
        console.error("Failed to delete model:", error);
        alert(
          `Failed to delete model: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  };

  return (
    <div className={styles.modelsDashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Models</h1>
        <button className={styles.uploadButton} onClick={onUploadClick}>
          Upload Model
        </button>
      </div>

      <StorageIndicator
        usedBytes={modelsStore.storageInfo.usedBytes}
        maxBytes={modelsStore.storageInfo.maxBytes}
        modelCount={modelsStore.models.length}
      />

      {modelsStore.isLoading ? (
        <div className={styles.loading}>Loading models...</div>
      ) : (
        <div className={styles.modelsGrid}>
          {modelsStore.models.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              onDelete={() => handleDeleteModel(model.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default ModelsDashboard;
