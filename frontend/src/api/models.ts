import client from "./client";
import { upload } from "@vercel/blob/client";

export interface Model {
  id: string;
  userId: string;
  name: string;
  fileName: string;
  fileSize: number;
  fileFormat: string;
  fileUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  assetData?: Record<string, string>; // For offline models with multiple files
}

export interface StorageInfo {
  usedBytes: number;
  maxBytes: number;
  modelCount: number;
}

export interface UploadModelResponse {
  model: Model;
  message: string;
}

interface BlobUploadRequest {
  name: string;
  fileUrls: Array<{
    url: string;
    pathname: string;
    size: number;
  }>;
  thumbnailUrl: string | null;
  totalSize: number;
}

export const modelsApi = {
  async getModels(): Promise<Model[]> {
    const response = await client.get<Model[]>("/models");
    return response.data;
  },

  async getModelById(id: string): Promise<Model> {
    const response = await client.get<Model>(`/models/${id}`);
    return response.data;
  },

  async uploadModel(
    files: File[],
    name: string,
    thumbnail?: Blob | null,
  ): Promise<Model> {
    try {
      // Upload files directly to Vercel Blob using client SDK
      const uploadedFiles = [];

      for (const file of files) {
        // Upload using Vercel Blob client SDK
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/models/upload-token",
          clientPayload: JSON.stringify({ filename: file.name }),
        });

        uploadedFiles.push({
          url: blob.url,
          pathname: blob.pathname,
          size: file.size,
        });
      }

      // Upload thumbnail if available
      let thumbnailUrl = null;
      if (thumbnail) {
        const blob = await upload("thumbnail.jpg", thumbnail, {
          access: "public",
          handleUploadUrl: "/api/models/upload-token",
          clientPayload: JSON.stringify({ filename: "thumbnail.jpg" }),
        });

        thumbnailUrl = blob.url;
      }

      // Save metadata to database
      const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
      const metadataResponse = await client.post<Model, BlobUploadRequest>(
        "/models/blob",
        {
          name,
          fileUrls: uploadedFiles,
          thumbnailUrl,
          totalSize,
        },
      );

      return metadataResponse.data;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  },

  async deleteModel(id: string): Promise<void> {
    try {
      await client.delete(`/models/${id}`);
    } catch (error) {
      console.error(`Failed to delete model ${id}:`, error);
      throw error;
    }
  },

  async getStorageInfo(): Promise<StorageInfo> {
    const response = await client.get<StorageInfo>("/models/storage/info");
    return response.data;
  },
};
