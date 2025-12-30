import client from "./client";

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
      // Upload files directly to Vercel Blob
      const uploadedFiles = [];

      for (const file of files) {
        const response = await fetch(`/api/models/upload-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to get upload URL for ${file.name}`);
        }

        const { url } = await response.json();

        // Upload directly to Blob storage
        const uploadResponse = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "x-ms-blob-type": "BlockBlob",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const blob = await uploadResponse.json();
        uploadedFiles.push({
          url: blob.url,
          pathname: blob.pathname,
          size: file.size,
        });
      }

      // Upload thumbnail if available
      let thumbnailUrl = null;
      if (thumbnail) {
        const thumbResponse = await fetch(`/api/models/upload-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            filename: "thumbnail.jpg",
            contentType: "image/jpeg",
          }),
        });

        if (thumbResponse.ok) {
          const { url } = await thumbResponse.json();
          const uploadResponse = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "image/jpeg",
              "x-ms-blob-type": "BlockBlob",
            },
            body: thumbnail,
          });

          if (uploadResponse.ok) {
            const blob = await uploadResponse.json();
            thumbnailUrl = blob.url;
          }
        }
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
