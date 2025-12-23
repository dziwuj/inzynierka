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

  async uploadModel(file: File, name: string): Promise<Model> {
    const formData = new FormData();
    formData.append("model", file);
    formData.append("name", name);

    const response = await client.upload("/models", formData);
    return (response.data as UploadModelResponse).model;
  },

  async deleteModel(id: string): Promise<void> {
    console.log(`Deleting model with ID: ${id}`);
    try {
      const response = await client.delete(`/models/${id}`);
      console.log(`Delete response:`, response);
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
