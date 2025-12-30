import { type FC, Suspense, useEffect, useRef, useState } from "react";
import * as React from "react";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { observer } from "mobx-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import * as THREE from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import AngleLeftIcon from "@/assets/icons/angle-left-solid-full.svg?react";
import AngleRightIcon from "@/assets/icons/angle-right-solid-full.svg?react";
import { useStores } from "@/stores/useStores";

import styles from "./ModelViewer.module.scss";

// Preload GLTF models to enable caching
useGLTF.preload.toString(); // Ensure preload function is available

// Create a context to pass asset URLs to child components
interface AssetContextType {
  assetUrls: Map<string, string>;
}

const AssetContext = React.createContext<AssetContextType>({
  assetUrls: new Map(),
});

interface Model3DProps {
  url: string;
  format: string;
  onBoundsCalculated?: (bounds: {
    width: number;
    height: number;
    depth: number;
    cameraDistance: number;
    center: THREE.Vector3;
  }) => void;
}

const OBJModel: FC<{ url: string; onLoad: (obj: THREE.Object3D) => void }> =
  React.memo(({ url, onLoad }) => {
    const { assetUrls } = React.useContext(AssetContext);
    const [objWithMaterials, setObjWithMaterials] =
      useState<THREE.Object3D | null>(null);

    useEffect(() => {
      let isMounted = true;
      const loadOBJ = async () => {
        try {
          // Find MTL file
          const objFilename =
            url.split("/").pop() || url.split("\\").pop() || url;
          const mtlFilename = objFilename.replace(/\.obj$/i, ".mtl");
          const mtlUrl = assetUrls.get(mtlFilename);

          let materials: MTLLoader.MaterialCreator | undefined;

          // Load MTL if available
          if (mtlUrl) {
            try {
              const mtlResponse = await fetch(mtlUrl);
              const mtlText = await mtlResponse.text();

              // Remove texture map directives to use color properties instead
              const cleanedMtl = mtlText.replace(
                /^(map_Ka|map_Kd|map_Ks|map_Ns|map_d|map_bump|bump|disp)\s+.+$/gim,
                "",
              );

              const mtlBlob = new Blob([cleanedMtl], { type: "text/plain" });
              const modifiedMtlUrl = URL.createObjectURL(mtlBlob);

              const mtlLoader = new MTLLoader();
              materials = await new Promise<MTLLoader.MaterialCreator>(
                resolve => {
                  mtlLoader.load(modifiedMtlUrl, mtl => {
                    mtl.preload();
                    URL.revokeObjectURL(modifiedMtlUrl);
                    resolve(mtl);
                  });
                },
              );
            } catch {
              // MTL failed, continue without it
            }
          }

          // Load OBJ
          const objLoader = new OBJLoader();
          if (materials) {
            objLoader.setMaterials(materials);
          }

          const obj = await new Promise<THREE.Group>(resolve => {
            objLoader.load(url, resolve);
          });

          // Apply default materials
          obj.traverse(child => {
            if (child instanceof THREE.Mesh) {
              // Apply default material if missing
              if (
                !child.material ||
                (Array.isArray(child.material) && child.material.length === 0)
              ) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xb0b0b0,
                  roughness: 0.7,
                  metalness: 0.3,
                });
              }
            }
          });

          if (isMounted) {
            setObjWithMaterials(obj);
            onLoad(obj);
          }
        } catch (error) {
          console.error("Failed to load OBJ model:", error);
        }
      };

      loadOBJ();
      return () => {
        isMounted = false;
      };
    }, [url, assetUrls, onLoad]);

    if (!objWithMaterials) return null;

    return <primitive object={objWithMaterials} />;
  });

const STLModel: FC<{ url: string; onLoad: (obj: THREE.Object3D) => void }> =
  React.memo(({ url, onLoad }) => {
    const geometry = useLoader(STLLoader, url);
    const meshRef = useRef<THREE.Mesh>(null);

    // Cache material to avoid recreation
    const material = React.useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: "#c0c0c0",
          metalness: 0.4,
          roughness: 0.6,
        }),
      [],
    );

    useEffect(() => {
      if (meshRef.current) {
        // STL files are often exported with Y-up from CAD software
        // but Three.js uses Z-up by default. Rotate to correct orientation.
        meshRef.current.rotation.x = -Math.PI / 2; // Rotate -90 degrees on X-axis
        onLoad(meshRef.current);
      }
    }, [onLoad]);

    return <mesh ref={meshRef} geometry={geometry} material={material} />;
  });

const PLYModel: FC<{ url: string; onLoad: (obj: THREE.Object3D) => void }> =
  React.memo(({ url, onLoad }) => {
    const geometry = useLoader(PLYLoader, url);
    const meshRef = useRef<THREE.Mesh>(null);

    // Check if geometry has vertex colors
    const hasVertexColors = geometry.attributes.color !== undefined;

    // Cache material to avoid recreation
    const material = React.useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          vertexColors: hasVertexColors,
          color: hasVertexColors ? 0xffffff : 0xc0c0c0,
          metalness: 0.3,
          roughness: 0.7,
        }),
      [hasVertexColors],
    );

    useEffect(() => {
      if (meshRef.current) {
        // PLY files often need rotation correction like STL
        meshRef.current.rotation.x = -Math.PI / 2;
        onLoad(meshRef.current);
      }
    }, [onLoad]);

    return <mesh ref={meshRef} geometry={geometry} material={material} />;
  });

const GLTFModel: FC<{ url: string; onLoad: (obj: THREE.Object3D) => void }> =
  React.memo(({ url, onLoad }) => {
    const gltf = useGLTF(url);

    useEffect(() => {
      if (gltf.scene) {
        onLoad(gltf.scene);
      }
    }, [gltf.scene, onLoad]);

    return <primitive object={gltf.scene} />;
  });

const Model3D: FC<Model3DProps> = React.memo(
  ({ url, format, onBoundsCalculated }) => {
    const handleLoad = React.useCallback(
      (object: THREE.Object3D) => {
        if (onBoundsCalculated) {
          const box = new THREE.Box3().setFromObject(object);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          // Calculate camera distance to fit entire model
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = 50;
          const cameraDistance =
            (maxDim / (2 * Math.tan((fov * Math.PI) / 360))) * 1.5;

          onBoundsCalculated({
            width: Math.round(size.x * 100) / 100,
            height: Math.round(size.y * 100) / 100,
            depth: Math.round(size.z * 100) / 100,
            cameraDistance: Math.max(cameraDistance, 1),
            center,
          });
        }
      },
      [onBoundsCalculated],
    );

    const ext = React.useMemo(() => format.toLowerCase(), [format]);

    if (ext === "obj") {
      return <OBJModel url={url} onLoad={handleLoad} />;
    } else if (ext === "stl") {
      return <STLModel url={url} onLoad={handleLoad} />;
    } else if (ext === "ply") {
      return <PLYModel url={url} onLoad={handleLoad} />;
    } else {
      // GLTF/GLB
      return <GLTFModel url={url} onLoad={handleLoad} />;
    }
  },
);

const LoadingSpinner = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner} />
    <p>Loading model...</p>
  </div>
);

interface ModelViewerProps {
  mode?: "online" | "offline";
}

export const ModelViewer: FC<ModelViewerProps> = observer(({ mode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { modelsStore, authStore } = useStores();

  const [modelBlobUrl, setModelBlobUrl] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string>("");
  const [modelFormat, setModelFormat] = useState<string>("gltf");
  const [error, setError] = useState<string | null>(null);
  const [assetsLoaded, setAssetsLoaded] = useState<boolean>(false);
  const [modelDimensions, setModelDimensions] = useState<{
    width: number;
    height: number;
    depth: number;
  } | null>(null);
  const [cameraPosition, setCameraPosition] = useState<
    [number, number, number]
  >([0, 0, 5]);
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const [gridSize, setGridSize] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isTechnicalModel, setIsTechnicalModel] = useState<boolean>(false);
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState<boolean>(false);
  const [headerHeight, setHeaderHeight] = useState(88);
  const [performanceMode, setPerformanceMode] = useState<boolean>(true);
  const blobUrlRef = useRef<string | null>(null);

  // Memoize bounds calculation callback
  const handleBoundsCalculated = React.useCallback(
    (bounds: {
      width: number;
      height: number;
      depth: number;
      cameraDistance: number;
      center: THREE.Vector3;
    }) => {
      setModelDimensions({
        width: bounds.width,
        height: bounds.height,
        depth: bounds.depth,
      });
      setCameraPosition([
        bounds.center.x,
        bounds.center.y,
        bounds.center.z + bounds.cameraDistance,
      ]);
      setCameraTarget([bounds.center.x, bounds.center.y, bounds.center.z]);
    },
    [],
  );
  const [assetBlobUrls, setAssetBlobUrls] = useState<Map<string, string>>(
    new Map(),
  );
  const headerRef = useRef<HTMLDivElement>(null);

  const isOffline = mode === "offline";

  useEffect(() => {
    const loadOfflineModel = async () => {
      setAssetsLoaded(false); // Reset on new load
      // Try to load from store first using URL param
      if (id) {
        const model = modelsStore.models.find(m => m.id === id);
        if (model) {
          setModelName(model.name);
          const extension = model.fileName.toLowerCase().split(".").pop() || "";
          setModelFormat(extension);
          const technicalFormats = ["step", "stp", "iges", "igs", "stl", "ply"];
          setIsTechnicalModel(technicalFormats.includes(extension));

          try {
            let modelBlob = await fetch(model.fileUrl).then(res => res.blob());
            const newAssetMap = new Map<string, string>();

            // If there are asset files (textures, buffers, etc.), create blob URLs for them
            if (model.assetData) {
              for (const [assetFileName, assetDataUrl] of Object.entries(
                model.assetData as Record<string, string>,
              )) {
                // Skip the main model file itself
                if (assetFileName === model.fileName) continue;

                const assetBlob = await fetch(assetDataUrl).then(res =>
                  res.blob(),
                );
                const assetBlobUrl = URL.createObjectURL(assetBlob);

                // Store with full filename
                newAssetMap.set(assetFileName, assetBlobUrl);
                // Also store with just basename for texture lookups
                const basename =
                  assetFileName.split("/").pop() || assetFileName;
                newAssetMap.set(basename, assetBlobUrl);
                // Also store without path separators (windows/unix)
                const baseOnly =
                  assetFileName.split("\\").pop() || assetFileName;
                if (baseOnly !== basename) {
                  newAssetMap.set(baseOnly, assetBlobUrl);
                }
              }
              setAssetBlobUrls(newAssetMap);
            }

            // For GLTF specifically, we need to modify the JSON to use blob URLs
            if (
              model.assetData &&
              model.fileName.toLowerCase().endsWith(".gltf")
            ) {
              // Modify GLTF JSON to use blob URLs
              const gltfText = await modelBlob.text();
              const gltfJson = JSON.parse(gltfText);

              // Update buffer URIs
              if (gltfJson.buffers) {
                for (const buffer of gltfJson.buffers) {
                  if (buffer.uri && !buffer.uri.startsWith("data:")) {
                    const basename = buffer.uri.split("/").pop();
                    const assetUrl =
                      newAssetMap.get(buffer.uri) || newAssetMap.get(basename);
                    if (assetUrl) {
                      buffer.uri = assetUrl;
                    }
                  }
                }
              }

              // Update image URIs
              if (gltfJson.images) {
                for (const image of gltfJson.images) {
                  if (image.uri && !image.uri.startsWith("data:")) {
                    const basename = image.uri.split("/").pop();
                    const assetUrl =
                      newAssetMap.get(image.uri) || newAssetMap.get(basename);
                    if (assetUrl) {
                      image.uri = assetUrl;
                    }
                  }
                }
              }

              // Create new blob with modified GLTF
              modelBlob = new Blob([JSON.stringify(gltfJson)], {
                type: "model/gltf+json",
              });
            }

            const blobUrl = URL.createObjectURL(modelBlob);
            blobUrlRef.current = blobUrl;
            setModelBlobUrl(blobUrl);
            setAssetsLoaded(true); // Assets are ready
          } catch (err) {
            console.error("Failed to load model:", err);
            const errorMsg =
              err instanceof Error ? err.message : "Failed to load model";
            setError(
              `Unable to load ${extension.toUpperCase()} model: ${errorMsg}. Please ensure the file is valid and not corrupted.`,
            );
          }
          return;
        }
      }

      // Fallback to location.state if no ID or model not found
      const {
        modelData,
        fileName: name,
        assetData,
      } = (location.state as {
        modelData?: string;
        fileName?: string;
        assetData?: Record<string, string>;
      }) || {};

      if (!modelData) {
        setError("No model data provided");
        return;
      }

      setModelName(name || "Model");

      // Determine if this is a technical model with standardized units
      const extension = name?.toLowerCase().split(".").pop() || "";
      setModelFormat(extension);
      const technicalFormats = ["step", "stp", "iges", "igs", "stl", "ply"];
      setIsTechnicalModel(technicalFormats.includes(extension));

      try {
        let modelBlob = await fetch(modelData).then(res => res.blob());

        // For GLTF specifically, we need to modify the JSON to use blob URLs
        if (assetData && name?.toLowerCase().endsWith(".gltf")) {
          // Build complete asset map first
          const completeAssetMap = new Map<string, string>();
          for (const [assetFileName, assetDataUrl] of Object.entries(
            assetData as Record<string, string>,
          )) {
            if (assetFileName === name) continue;
            const assetBlob = await fetch(assetDataUrl).then(res => res.blob());
            const assetBlobUrl = URL.createObjectURL(assetBlob);
            const basename = assetFileName.split("/").pop() || assetFileName;
            const baseOnly = assetFileName.split("\\").pop() || assetFileName;
            completeAssetMap.set(assetFileName, assetBlobUrl);
            completeAssetMap.set(basename, assetBlobUrl);
            if (baseOnly !== basename) {
              completeAssetMap.set(baseOnly, assetBlobUrl);
            }
          }
          setAssetBlobUrls(completeAssetMap);

          // Modify GLTF JSON to use blob URLs
          const gltfText = await modelBlob.text();
          const gltfJson = JSON.parse(gltfText);

          // Update buffer URIs
          if (gltfJson.buffers) {
            for (const buffer of gltfJson.buffers) {
              if (buffer.uri && !buffer.uri.startsWith("data:")) {
                const basename = buffer.uri.split("/").pop();
                const assetUrl =
                  completeAssetMap.get(buffer.uri) ||
                  completeAssetMap.get(basename);
                if (assetUrl) {
                  buffer.uri = assetUrl;
                }
              }
            }
          }

          // Update image URIs
          if (gltfJson.images) {
            for (const image of gltfJson.images) {
              if (image.uri && !image.uri.startsWith("data:")) {
                const basename = image.uri.split("/").pop();
                const assetUrl =
                  completeAssetMap.get(image.uri) ||
                  completeAssetMap.get(basename);
                if (assetUrl) {
                  image.uri = assetUrl;
                }
              }
            }
          }

          // Create new blob with modified GLTF
          modelBlob = new Blob([JSON.stringify(gltfJson)], {
            type: "model/gltf+json",
          });
        }

        const blobUrl = URL.createObjectURL(modelBlob);
        blobUrlRef.current = blobUrl;
        setModelBlobUrl(blobUrl);
      } catch (err) {
        console.error("Failed to load model:", err);
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load model";
        setError(
          `Unable to load ${extension.toUpperCase()} model: ${errorMsg}. Please ensure the file is valid and not corrupted.`,
        );
      }
    };

    const loadOnlineModel = async () => {
      setAssetsLoaded(false); // Reset on new load
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
        setModelFormat(model.fileFormat.toLowerCase());

        // Determine if this is a technical model with standardized units
        const technicalFormats = ["step", "stp", "iges", "igs", "stl", "ply"];
        setIsTechnicalModel(
          technicalFormats.includes(model.fileFormat.toLowerCase()),
        );

        // For offline models, fileUrl is already a data URL
        if (authStore.isOfflineMode && model.fileUrl.startsWith("data:")) {
          // Convert data URL to blob for processing
          const response = await fetch(model.fileUrl);
          let blob = await response.blob();

          // If there's asset data (multi-file GLTF model), process it
          if (model.assetData && model.fileFormat.toLowerCase() === "gltf") {
            // Create blob URLs for all asset files
            const assetMap = new Map<string, string>();
            for (const [fileName, dataUrl] of Object.entries(model.assetData)) {
              if (fileName !== model.fileName) {
                const assetResponse = await fetch(dataUrl);
                const assetBlob = await assetResponse.blob();
                const assetBlobUrl = URL.createObjectURL(assetBlob);
                const basename = fileName.split("/").pop() || fileName;
                assetMap.set(fileName, assetBlobUrl);
                assetMap.set(basename, assetBlobUrl);
              }
            }
            setAssetBlobUrls(assetMap);

            // Modify GLTF JSON to use blob URLs
            const gltfText = await blob.text();
            const gltfJson = JSON.parse(gltfText);

            // Update buffer URIs
            if (gltfJson.buffers) {
              for (const buffer of gltfJson.buffers) {
                if (buffer.uri && !buffer.uri.startsWith("data:")) {
                  const basename = buffer.uri.split("/").pop();
                  const assetUrl =
                    assetMap.get(buffer.uri) || assetMap.get(basename);
                  if (assetUrl) {
                    buffer.uri = assetUrl;
                  }
                }
              }
            }

            // Update image URIs
            if (gltfJson.images) {
              for (const image of gltfJson.images) {
                if (image.uri && !image.uri.startsWith("data:")) {
                  const basename = image.uri.split("/").pop();
                  const assetUrl =
                    assetMap.get(image.uri) || assetMap.get(basename);
                  if (assetUrl) {
                    image.uri = assetUrl;
                  }
                }
              }
            }

            // Create modified GLTF blob
            blob = new Blob([JSON.stringify(gltfJson)], {
              type: "model/gltf+json",
            });
          }

          // Create blob URL for the model
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;
          setModelBlobUrl(blobUrl);
        } else {
          const token = authStore.accessToken;

          // Fetch the main model file
          const modelResponse = await fetch(model.fileUrl, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          });

          if (!modelResponse.ok) {
            throw new Error(
              `Failed to load model: ${modelResponse.statusText}`,
            );
          }

          let modelBlob = await modelResponse.blob();
          const newAssetMap = new Map<string, string>();

          // Fetch associated assets (textures, buffers, etc.) for all supported formats
          const assetsResponse = await fetch(`/api/models/${id}/assets`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          });

          if (assetsResponse.ok) {
            const assets = await assetsResponse.json();

            // Create blob URLs for all assets (works for GLTF, OBJ, etc.)
            for (const asset of assets) {
              const assetResponse = await fetch(asset.downloadUrl, {
                headers: {
                  Authorization: token ? `Bearer ${token}` : "",
                },
              });

              if (assetResponse.ok) {
                const assetBlob = await assetResponse.blob();
                const assetBlobUrl = URL.createObjectURL(assetBlob);

                // Store with multiple key variations so the loader can find them
                // 1. Original filename from the asset
                newAssetMap.set(asset.fileName, assetBlobUrl);

                // 2. Asset ID (MTL files might reference textures by ID)
                if (asset.id) {
                  newAssetMap.set(asset.id, assetBlobUrl);
                }

                // 3. Just the basename
                const basename =
                  asset.fileName.split("/").pop() || asset.fileName;
                newAssetMap.set(basename, assetBlobUrl);

                // 4. Windows path variant
                const baseOnly =
                  asset.fileName.split("\\").pop() || asset.fileName;
                if (baseOnly !== basename) {
                  newAssetMap.set(baseOnly, assetBlobUrl);
                }

                // 5. Full API path that OBJ loaders might use
                const apiPath = `/api/models/${id}/assets/${basename}`;
                newAssetMap.set(apiPath, assetBlobUrl);
              }
            }
            setAssetBlobUrls(newAssetMap);
          }

          // For GLTF specifically, modify JSON to use blob URLs
          if (model.fileFormat.toLowerCase() === "gltf" && assetsResponse.ok) {
            // Modify GLTF JSON to use blob URLs for external resources
            const gltfText = await modelBlob.text();
            const gltfJson = JSON.parse(gltfText);

            // Update URIs in GLTF to point to blob URLs
            if (gltfJson.buffers) {
              for (const buffer of gltfJson.buffers) {
                if (buffer.uri && !buffer.uri.startsWith("data:")) {
                  // Try exact match first, then basename
                  const basename = buffer.uri.split("/").pop();
                  const assetUrl =
                    newAssetMap.get(buffer.uri) || newAssetMap.get(basename);
                  if (assetUrl) {
                    buffer.uri = assetUrl;
                  }
                }
              }
            }

            if (gltfJson.images) {
              for (const image of gltfJson.images) {
                if (image.uri && !image.uri.startsWith("data:")) {
                  // Try exact match first, then basename
                  const basename = image.uri.split("/").pop();
                  const assetUrl =
                    newAssetMap.get(image.uri) || newAssetMap.get(basename);
                  if (assetUrl) {
                    image.uri = assetUrl;
                  }
                }
              }
            }

            // Create new blob with modified GLTF
            modelBlob = new Blob([JSON.stringify(gltfJson)], {
              type: "model/gltf+json",
            });
          }

          const blobUrl = URL.createObjectURL(modelBlob);
          blobUrlRef.current = blobUrl;
          setModelBlobUrl(blobUrl);
          setAssetsLoaded(true); // Assets and model are ready
        }
      } catch (err) {
        console.error("Failed to load model:", err);
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load model";
        const format = modelFormat || "unknown";
        setError(
          `Unable to load ${format.toUpperCase()} model: ${errorMsg}. The file may be corrupted or in an unsupported format.`,
        );
      }
    };

    if (isOffline) {
      loadOfflineModel();
    } else {
      loadOnlineModel();
    }

    // Cleanup blob URLs on unmount
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      assetBlobUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [
    isOffline,
    location.state,
    id,
    modelsStore,
    authStore.accessToken,
    authStore.isOfflineMode,
    modelFormat,
  ]);

  useEffect(() => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight;
      setHeaderHeight(height);
    }
  }, [modelName]);

  const handleBack = () => {
    navigate(authStore.isOfflineMode ? "/offline" : "/dashboard");
  };
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            <AngleLeftIcon width={14} height={14} />
            <span className={styles.backButtonText}> Return</span>
          </button>
        </div>
        <div className={styles.errorContainer}>
          <h2>⚠️ Unable to Load Model</h2>
          <p>{error}</p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <button onClick={handleBack}>
              {authStore.isOfflineMode
                ? "Select Another File"
                : "Return to Dashboard"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!modelBlobUrl || !assetsLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            <AngleLeftIcon width={14} height={14} />
            <span className={styles.backButtonText}> Return</span>
          </button>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header} ref={headerRef}>
        <button className={styles.backButton} onClick={handleBack}>
          <AngleLeftIcon width={14} height={14} />
          <span className={styles.backButtonText}> Return</span>
        </button>
        <h1 className={styles.fileName}>{modelName}</h1>
      </div>

      {/* Mobile toggle button */}
      <button
        className={`${styles.statsToggle} ${isStatsPanelOpen ? styles.open : ""}`}
        style={{ top: `${headerHeight}px` }}
        onClick={() => setIsStatsPanelOpen(!isStatsPanelOpen)}>
        <AngleLeftIcon width={20} height={20} />
      </button>

      <div
        className={`${styles.statsPanel} ${isStatsPanelOpen ? styles.open : ""}`}
        style={{ top: `${headerHeight}px` }}>
        <div className={styles.statsCard}>
          <div className={styles.statsTitle}>Model Info</div>
          {modelDimensions && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Size:</span>
              <span className={styles.statValue}>
                {modelDimensions.width} × {modelDimensions.height} ×{" "}
                {modelDimensions.depth}
              </span>
            </div>
          )}
          <div className={styles.statsTitle} style={{ marginTop: "0.75rem" }}>
            Display Settings
          </div>
          <div className={styles.statItem}>
            <label className={styles.statLabel} htmlFor="highQualityMode">
              <input
                type="checkbox"
                id="highQualityMode"
                checked={!performanceMode}
                onChange={e => setPerformanceMode(!e.target.checked)}
                style={{ marginRight: "0.5rem" }}
              />
              High Quality Mode
            </label>
          </div>
          <div className={styles.statItem}>
            <label className={styles.statLabel} htmlFor="showGrid">
              <input
                type="checkbox"
                id="showGrid"
                checked={showGrid}
                onChange={e => setShowGrid(e.target.checked)}
                style={{ marginRight: "0.5rem" }}
              />
              Show Grid
            </label>
          </div>
          {showGrid && (
            <div className={styles.statItem}>
              <label className={styles.statLabel} htmlFor="gridSize">
                {isTechnicalModel ? "Grid (boxes):" : "Grid Size:"}
              </label>
              <select
                id="gridSize"
                className={styles.statSelect}
                value={gridSize}
                onChange={e => setGridSize(Number(e.target.value))}>
                <option value={1}>1</option>
                <option value={10}>10</option>
                <option value={100}>100</option>
                <option value={1000}>1000</option>
              </select>
            </div>
          )}
        </div>
      </div>
      <div className={styles.controls}>
        <div className={styles.controlsCard}>
          <div className={styles.controlsSection}>
            <div className={styles.controlsTitle}>Desktop</div>
            <div className={styles.controlItem}>
              Left click + drag{" "}
              <AngleRightIcon
                width={12}
                height={12}
                style={{ display: "inline", verticalAlign: "middle" }}
              />{" "}
              Rotate
            </div>
            <div className={styles.controlItem}>
              Right click + drag{" "}
              <AngleRightIcon
                width={12}
                height={12}
                style={{ display: "inline", verticalAlign: "middle" }}
              />{" "}
              Pan
            </div>
            <div className={styles.controlItem}>
              Scroll{" "}
              <AngleRightIcon
                width={12}
                height={12}
                style={{ display: "inline", verticalAlign: "middle" }}
              />{" "}
              Zoom
            </div>
          </div>
          <div className={styles.controlsSection}>
            <div className={styles.controlsTitle}>Touch</div>
            <div className={styles.controlItem}>
              1 finger{" "}
              <AngleRightIcon
                width={12}
                height={12}
                style={{ display: "inline", verticalAlign: "middle" }}
              />{" "}
              Rotate
            </div>
            <div className={styles.controlItem}>
              2 fingers{" "}
              <AngleRightIcon
                width={12}
                height={12}
                style={{ display: "inline", verticalAlign: "middle" }}
              />{" "}
              Pan/Zoom
            </div>
          </div>
        </div>
      </div>
      <AssetContext.Provider value={{ assetUrls: assetBlobUrls }}>
        <Canvas
          className={styles.canvas}
          gl={{
            antialias: !performanceMode,
            powerPreference: performanceMode ? "high-performance" : "default",
            precision: performanceMode ? "lowp" : "highp",
            alpha: false,
            stencil: false,
            depth: true,
          }}
          dpr={performanceMode ? 1 : Math.min(window.devicePixelRatio, 2)}
          frameloop="demand"
          performance={{ min: 0.5 }}
          shadows={!performanceMode}
          style={{ background: "#3a3a3a" }}>
          <color attach="background" args={["#3a3a3a"]} />
          <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />
          <ambientLight intensity={performanceMode ? 1.2 : 0.8} />
          {!performanceMode && (
            <>
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-5, -5, -5]} intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={0.5} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
            </>
          )}
          {performanceMode && (
            <directionalLight position={[5, 5, 5]} intensity={1} />
          )}
          <Suspense fallback={null}>
            <Model3D
              url={modelBlobUrl}
              format={modelFormat}
              onBoundsCalculated={handleBoundsCalculated}
            />
          </Suspense>
          <OrbitControls
            target={cameraTarget}
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={1000}
            makeDefault
          />
          {showGrid && (
            <>
              <gridHelper
                args={[10000, 10000 / gridSize]}
                position={[0, 0, 0]}
              />
              <axesHelper args={[5000]} />
            </>
          )}
        </Canvas>
      </AssetContext.Provider>
    </div>
  );
});
