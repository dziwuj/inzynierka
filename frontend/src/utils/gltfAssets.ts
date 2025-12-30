/**
 * Utility functions for handling GLTF models with external resources
 */

export interface GLTFAsset {
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  downloadUrl: string;
}

/**
 * Identifies if a model format requires external asset support
 */
export function requiresAssetSupport(format: string): boolean {
  return format.toLowerCase() === "gltf";
}

/**
 * Identifies if a file is a main model file
 */
export function isMainModelFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["gltf", "glb", "obj", "stl", "ply"].includes(ext || "");
}

/**
 * Identifies if a file is an asset file (texture, binary data, etc.)
 */
export function isAssetFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["bin", "jpg", "jpeg", "png", "webp", "ktx2"].includes(ext || "");
}

/**
 * Gets the file type category
 */
export function getFileType(
  fileName: string,
): "model" | "texture" | "binary" | "other" {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (isMainModelFile(fileName)) return "model";
  if (["bin"].includes(ext)) return "binary";
  if (["jpg", "jpeg", "png", "webp", "ktx2"].includes(ext)) return "texture";

  return "other";
}

/**
 * Processes a GLTF JSON to update external resource URIs to blob URLs
 */
export function processGLTFWithAssets(
  gltfText: string,
  assetMap: Map<string, string>,
): string {
  try {
    const gltfJson = JSON.parse(gltfText);

    // Update buffer URIs
    if (gltfJson.buffers) {
      for (const buffer of gltfJson.buffers) {
        if (buffer.uri && !buffer.uri.startsWith("data:")) {
          const assetUrl = assetMap.get(buffer.uri);
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
          const assetUrl = assetMap.get(image.uri);
          if (assetUrl) {
            image.uri = assetUrl;
          }
        }
      }
    }

    return JSON.stringify(gltfJson);
  } catch (error) {
    console.error("Failed to process GLTF:", error);
    return gltfText;
  }
}

/**
 * Validates that a file list contains a valid main model and compatible assets
 */
export function validateModelFiles(files: File[]): {
  valid: boolean;
  error?: string;
  mainFile?: File;
  assetFiles?: File[];
} {
  if (files.length === 0) {
    return { valid: false, error: "No files provided" };
  }

  const mainFile = files.find(file => isMainModelFile(file.name));

  if (!mainFile) {
    return { valid: false, error: "No valid model file found" };
  }

  const assetFiles = files.filter(file => file !== mainFile);

  // Validate all other files are valid assets
  const invalidFiles = assetFiles.filter(file => !isAssetFile(file.name));
  if (invalidFiles.length > 0) {
    return {
      valid: false,
      error: `Invalid asset files: ${invalidFiles.map(f => f.name).join(", ")}`,
    };
  }

  return {
    valid: true,
    mainFile,
    assetFiles,
  };
}
