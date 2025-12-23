import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router-dom";

import { useStores } from "../../stores/useStores";

import EmptyDashboard from "./EmptyDashboard/EmptyDashboard";
import ModelsDashboard from "./ModelsDashboard";
import UploadModal from "./UploadModal/UploadModal";

import styles from "./Dashboard.module.scss";

const Dashboard = observer(() => {
  const navigate = useNavigate();
  const { authStore, modelsStore } = useStores();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (authStore.isAuthenticated) {
      modelsStore.fetchModels();
      modelsStore.fetchStorageInfo();
    } else if (authStore.isOfflineMode) {
      modelsStore.loadOfflineModels();
    }
  }, [authStore.isAuthenticated, authStore.isOfflineMode, modelsStore]);

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = () => {
    setIsUploadModalOpen(false);
    modelsStore.fetchModels();
    modelsStore.fetchStorageInfo();
  };

  const handleLogout = async () => {
    await authStore.logout();
    navigate("/");
  };

  const handleReturnFromOffline = () => {
    authStore.logout();
    navigate("/");
  };

  const hasModels = modelsStore.models.length > 0;
  const showModelsView =
    (authStore.isAuthenticated || authStore.isOfflineMode) && hasModels;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>3D Model Viewer</h1>
        {authStore.isAuthenticated ? (
          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        ) : authStore.isOfflineMode ? (
          <button
            className={styles.returnButton}
            onClick={handleReturnFromOffline}>
            Return to Login
          </button>
        ) : null}
      </div>
      {showModelsView ? (
        <ModelsDashboard onUploadClick={handleUploadClick} />
      ) : (
        <EmptyDashboard
          onUploadClick={handleUploadClick}
          isAuthenticated={authStore.isAuthenticated || authStore.isOfflineMode}
        />
      )}

      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
});

export default Dashboard;
