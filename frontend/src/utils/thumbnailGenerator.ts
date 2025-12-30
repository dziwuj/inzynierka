import * as THREE from "three";
import {
  type GLTF,
  GLTFLoader,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export async function generateThumbnail(
  files: File[],
  width: number = 400,
  height: number = 300,
): Promise<Blob | null> {
  // Find the main model file
  const mainFile = files.find(file => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ["gltf", "glb", "obj", "stl", "ply"].includes(ext || "");
  });

  if (!mainFile) {
    return null;
  }

  try {
    // Create offscreen renderer
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setClearColor(0x2c2c2e, 1); // Darker background to match viewer

    // Create scene
    const scene = new THREE.Scene();

    // Add lights (reduced ambient, add point light for better depth)
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // Create camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);

    // Load model
    let model: THREE.Object3D;
    const ext = mainFile.name.split(".").pop()?.toLowerCase();

    if (ext === "gltf") {
      // For GLTF, we need to handle external resources
      // Create blob URLs for all asset files
      const assetMap = new Map<string, string>();
      for (const file of files) {
        if (file === mainFile) continue;
        const blobUrl = URL.createObjectURL(file);
        assetMap.set(file.name, blobUrl);
        const basename = file.name.split("/").pop() || file.name;
        assetMap.set(basename, blobUrl);
      }

      // Read and modify GLTF JSON
      const gltfText = await mainFile.text();
      const gltfJson = JSON.parse(gltfText);

      // Update buffer URIs
      if (gltfJson.buffers) {
        for (const buffer of gltfJson.buffers) {
          if (buffer.uri && !buffer.uri.startsWith("data:")) {
            const basename = buffer.uri.split("/").pop();
            const assetUrl = assetMap.get(buffer.uri) || assetMap.get(basename);
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
            const assetUrl = assetMap.get(image.uri) || assetMap.get(basename);
            if (assetUrl) {
              image.uri = assetUrl;
            }
          }
        }
      }

      // Create modified GLTF blob
      const modifiedGltfBlob = new Blob([JSON.stringify(gltfJson)], {
        type: "model/gltf+json",
      });
      const objectUrl = URL.createObjectURL(modifiedGltfBlob);

      const loader = new GLTFLoader();
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        loader.load(
          objectUrl,
          gltf => {
            resolve(gltf);
          },
          undefined,
          error => {
            console.error("[Thumbnail] Error loading model:", error);
            reject(error);
          },
        );
      });
      model = gltf.scene;

      // Cleanup asset URLs
      URL.revokeObjectURL(objectUrl);
      assetMap.forEach(url => URL.revokeObjectURL(url));
    } else if (ext === "glb") {
      // GLB has everything embedded
      const loader = new GLTFLoader();
      const objectUrl = URL.createObjectURL(mainFile);
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        loader.load(
          objectUrl,
          gltf => {
            resolve(gltf);
          },
          undefined,
          error => {
            console.error("[Thumbnail] Error loading model:", error);
            reject(error);
          },
        );
      });
      model = gltf.scene;
      URL.revokeObjectURL(objectUrl);
    } else if (ext === "obj") {
      // OBJ with optional MTL
      const objectUrl = URL.createObjectURL(mainFile);
      const manager = new THREE.LoadingManager();

      // Create blob URLs for all asset files (textures, mtl files)
      const assetMap = new Map<string, string>();
      for (const file of files) {
        if (file === mainFile) continue;
        const blobUrl = URL.createObjectURL(file);
        assetMap.set(file.name, blobUrl);
        const basename = file.name.split("/").pop() || file.name;
        assetMap.set(basename, blobUrl);
      }

      manager.setURLModifier(url => {
        let filename = url.split("/").pop() || url;
        filename = filename.split("\\").pop() || filename;
        const blobUrl = assetMap.get(url) || assetMap.get(filename);
        return blobUrl || url;
      });

      try {
        const objLoader = new OBJLoader(manager);
        model = await new Promise<THREE.Object3D>((resolve, reject) => {
          objLoader.load(
            objectUrl,
            obj => resolve(obj),
            undefined,
            error => reject(error),
          );
        });
      } catch (error) {
        console.error("[Thumbnail] Failed to load OBJ:", error);
        return null;
      } finally {
        URL.revokeObjectURL(objectUrl);
        assetMap.forEach(url => URL.revokeObjectURL(url));
      }
    } else if (ext === "stl") {
      // STL
      const objectUrl = URL.createObjectURL(mainFile);
      try {
        const loader = new STLLoader();
        const geometry = await new Promise<THREE.BufferGeometry>(
          (resolve, reject) => {
            loader.load(
              objectUrl,
              geom => resolve(geom),
              undefined,
              error => reject(error),
            );
          },
        );

        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.4,
            roughness: 0.6,
          }),
        );
        mesh.rotation.x = -Math.PI / 2; // Correct STL orientation
        model = mesh;
      } catch (error) {
        console.error("[Thumbnail] Failed to load STL:", error);
        return null;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } else if (ext === "ply") {
      // PLY
      const objectUrl = URL.createObjectURL(mainFile);
      try {
        const loader = new PLYLoader();
        const geometry = await new Promise<THREE.BufferGeometry>(
          (resolve, reject) => {
            loader.load(
              objectUrl,
              geom => resolve(geom),
              undefined,
              error => reject(error),
            );
          },
        );

        // Check if geometry has vertex colors
        const hasVertexColors = geometry.attributes.color !== undefined;

        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            vertexColors: hasVertexColors,
            color: hasVertexColors ? 0xffffff : 0xc0c0c0,
            metalness: 0.3,
            roughness: 0.7,
          }),
        );
        mesh.rotation.x = -Math.PI / 2; // Correct PLY orientation
        model = mesh;
      } catch (error) {
        console.error("[Thumbnail] Failed to load PLY:", error);
        return null;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } else {
      return null;
    }

    scene.add(model);

    // Calculate bounding box and position camera
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Calculate camera distance
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = 50;
    const cameraDistance =
      (maxDim / (2 * Math.tan((fov * Math.PI) / 360))) * 1.5;

    // Position camera at 45 degrees
    const angle = Math.PI / 4;
    camera.position.set(
      center.x + cameraDistance * Math.cos(angle),
      center.y + cameraDistance * 0.5,
      center.z + cameraDistance * Math.sin(angle),
    );
    camera.lookAt(center);

    // Render
    renderer.render(scene, camera);

    // Convert to blob
    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(
        blob => {
          resolve(blob);
        },
        "image/jpeg",
        0.9,
      );
    });

    // Cleanup
    renderer.dispose();
    scene.clear();

    return blob;
  } catch (error) {
    console.error("[Thumbnail] Failed to generate thumbnail:", error);
    return null;
  }
}
