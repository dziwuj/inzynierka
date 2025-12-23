import { type FC, Suspense, useEffect, useRef, useState } from "react";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { observer } from "mobx-react";
import { useNavigate, useParams } from "react-router-dom";

import { useStores } from "@/stores/useStores";

import styles from "./ModelView.module.scss";

interface Model3DProps {
  url: string;
}

const Model3D: FC<Model3DProps> = ({ url }) => {
  const gltf = useGLTF(url);
  return <primitive object={gltf.scene} />;
};

const LoadingSpinner = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner} />
    <p>Loading model...</p>
  </div>
);

export const ModelView: FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { modelsStore, authStore } = useStores();
  const [modelBlobUrl, setModelBlobUrl] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      if (!id) {
        setError("No model ID provided");
        return;
      }

      try {
        const model = await modelsStore.getModelById(id);
        if (!model) {
          setError("Model not found");
          return;
        }

        setModelName(model.name);

        // For offline models, fileUrl is already a data URL
        if (authStore.isOfflineMode && model.fileUrl.startsWith("data:")) {
          // Convert data URL to blob URL for Three.js
          const response = await fetch(model.fileUrl);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;
          setModelBlobUrl(blobUrl);
        } else {
          // Fetch the model file with authentication for online mode
          const token = authStore.accessToken;
          const response = await fetch(model.fileUrl, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to load model: ${response.statusText}`);
          }

          // Create a blob URL from the response
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;
          setModelBlobUrl(blobUrl);
        }
      } catch (err) {
        console.error("Failed to load model:", err);
        setError(err instanceof Error ? err.message : "Failed to load model");
      }
    };

    loadModel();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [id, modelsStore, authStore.accessToken, authStore.isOfflineMode]);

  const handleBack = () => {
    navigate("/dashboard");
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            ← Back
          </button>
        </div>
        <div className={styles.errorContainer}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBack}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!modelBlobUrl) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            ← Back
          </button>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBack}>
          ← Back
        </button>
        <h1 className={styles.fileName}>{modelName}</h1>
        <div className={styles.controls}>
          <span className={styles.hint}>Left click + drag to rotate</span>
          <span className={styles.hint}>Right click + drag to pan</span>
          <span className={styles.hint}>Scroll to zoom</span>
        </div>
      </div>
      <Canvas className={styles.canvas}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Suspense fallback={null}>
          <Model3D url={modelBlobUrl} />
        </Suspense>
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={100}
        />
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
});
