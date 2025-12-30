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
      // Upload files to backend which then uploads to Vercel Blob
      const uploadedFiles = [];

      for (const file of files) {
        // Convert file to base64
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const response = await client.post<
          { url: string; pathname: string; size: number },
          { filename: string; contentType: string; fileData: string }
        >("/models/upload-file", {
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          fileData,
        });

        uploadedFiles.push({
          url: response.data.url,
          pathname: response.data.pathname,
          size: response.data.size,
        });
      }

      // Upload thumbnail if available
      let thumbnailUrl = null;
      if (thumbnail) {
        const thumbData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(thumbnail);
        });

        const thumbResponse = await client.post<
          { url: string; pathname: string; size: number },
          { filename: string; contentType: string; fileData: string }
        >("/models/upload-file", {
          filename: "thumbnail.jpg",
          contentType: "image/jpeg",
          fileData: thumbData,
        });

        thumbnailUrl = thumbResponse.data.url;
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
