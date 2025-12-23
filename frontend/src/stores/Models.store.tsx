import { makeAutoObservable, runInAction } from "mobx";

import { Model, modelsApi, StorageInfo } from "../api/models";

export class ModelsStore {
  models: Model[] = [];
  storageInfo: StorageInfo = {
    usedBytes: 0,
    maxBytes: 500 * 1024 * 1024, // 500MB default
    modelCount: 0,
  };
  isLoading = false;
  isUploading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Offline mode methods - temporary, no persistence
  loadOfflineModels() {
    // In offline mode, we don't load anything - models are temporary
    runInAction(() => {
      this.models = [];
      this.storageInfo = {
        usedBytes: 0,
        maxBytes: 500 * 1024 * 1024,
        modelCount: 0,
      };
    });
  }

  async uploadOfflineModel(file: File, name: string) {
    this.isUploading = true;
    this.error = null;

    try {
      // Read file as base64 for temporary display
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const newModel: Model = {
        id: `offline-${Date.now()}`,
        userId: "offline",
        name,
        fileName: file.name,
        fileSize: file.size,
        fileFormat: file.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
        fileUrl: fileData,
        thumbnailUrl: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      runInAction(() => {
        // Replace any existing model (only one at a time)
        this.models = [newModel];
        this.storageInfo = {
          usedBytes: file.size,
          maxBytes: 500 * 1024 * 1024,
          modelCount: 1,
        };
        this.isUploading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to upload model";
        this.isUploading = false;
      });
      throw error;
    }
  }

  deleteOfflineModel(_id: string) {
    runInAction(() => {
      this.models = [];
      this.storageInfo = {
        usedBytes: 0,
        maxBytes: 500 * 1024 * 1024,
        modelCount: 0,
      };
    });
  }

  clearOfflineModels() {
    runInAction(() => {
      this.models = [];
      this.storageInfo = {
        usedBytes: 0,
        maxBytes: 500 * 1024 * 1024,
        modelCount: 0,
      };
    });
  }

  async fetchModels() {
    this.isLoading = true;
    this.error = null;

    try {
      const models = await modelsApi.getModels();
      runInAction(() => {
        this.models = models;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch models";
        this.isLoading = false;
      });
    }
  }

  async fetchStorageInfo() {
    try {
      const info = await modelsApi.getStorageInfo();
      runInAction(() => {
        this.storageInfo = info;
      });
    } catch (error) {
      console.error("Failed to fetch storage info:", error);
    }
  }

  async uploadModel(file: File, name: string) {
    this.isUploading = true;
    this.error = null;

    try {
      const model = await modelsApi.uploadModel(file, name);
      runInAction(() => {
        this.models.push(model);
        this.isUploading = false;
      });
      await this.fetchStorageInfo();
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to upload model";
        this.isUploading = false;
      });
      throw error;
    }
  }

  async deleteModel(id: string) {
    this.isLoading = true;
    this.error = null;

    try {
      await modelsApi.deleteModel(id);
      runInAction(() => {
        this.models = this.models.filter(model => model.id !== id);
        this.isLoading = false;
      });
      // Refresh storage info after deletion
      await this.fetchStorageInfo();
    } catch (error) {
      console.error("Delete model error:", error);
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to delete model";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async getModelById(id: string): Promise<Model | null> {
    try {
      // First check if we have it in local cache
      const cached = this.models.find(model => model.id === id);
      if (cached) {
        return cached;
      }

      // Otherwise fetch from API
      const model = await modelsApi.getModelById(id);
      return model;
    } catch (error) {
      console.error("Failed to get model:", error);
      return null;
    }
  }

  clearError() {
    this.error = null;
  }
}
