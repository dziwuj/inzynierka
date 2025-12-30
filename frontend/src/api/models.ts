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
    const formData = new FormData();

    // Append all files
    files.forEach(file => {
      formData.append("models", file);
    });
    formData.append("name", name);

    // Append thumbnail if available
    if (thumbnail) {
      formData.append("thumbnail", thumbnail, "thumbnail.jpg");
    }

    const response = await client.upload("/models", formData);
    return (response.data as UploadModelResponse).model;
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
