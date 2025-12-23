import { type FC, Suspense, useEffect, useRef, useState } from "react";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useLocation, useNavigate } from "react-router-dom";

import styles from "./OfflineModelView.module.scss";

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

export const OfflineModelView: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [modelBlobUrl, setModelBlobUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const { modelData, fileName: name } = location.state || {};

    if (!modelData) {
      setError("No model data provided");
      return;
    }

    setFileName(name || "Model");

    // Convert data URL to blob URL for Three.js
    fetch(modelData)
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;
        setModelBlobUrl(blobUrl);
      })
      .catch(err => {
        console.error("Failed to load model:", err);
        setError("Failed to load model");
      });

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [location.state]);

  const handleBack = () => {
    navigate("/offline");
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
          <button onClick={handleBack}>Select Another File</button>
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
        <h1 className={styles.fileName}>{fileName}</h1>
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
};
