import { makeAutoObservable, runInAction } from "mobx";

import { authApi } from "@/api/auth";
import type { User } from "@/types";

import { RootStore } from "./Root.store";

export class AuthStore {
  rootStore: RootStore;
  accessToken: string | null = null;
  user: User | null = null;
  isAuthenticated = false;
  isOfflineMode = false;
  loading = false;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("authUser");
    const offlineMode = localStorage.getItem("offlineMode") === "true";

    if (token && user) {
      this.accessToken = token;
      this.user = JSON.parse(user);
      this.isAuthenticated = true;
    }

    if (offlineMode) {
      this.isOfflineMode = true;
    }
  }

  setToken(token: string) {
    this.accessToken = token;
    this.isAuthenticated = true;
    localStorage.setItem("authToken", token);
  }

  setUser(user: User) {
    this.user = user;
    localStorage.setItem("authUser", JSON.stringify(user));
  }

  setOfflineMode(enabled: boolean) {
    this.isOfflineMode = enabled;
    localStorage.setItem("offlineMode", enabled.toString());
  }

  async logout() {
    try {
      if (!this.isOfflineMode) {
        await authApi.logout();
      }
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      // Clear offline models when logging out
      if (this.isOfflineMode && this.rootStore.modelsStore) {
        this.rootStore.modelsStore.clearOfflineModels();
      }

      runInAction(() => {
        this.accessToken = null;
        this.user = null;
        this.isAuthenticated = false;
        this.isOfflineMode = false;
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        localStorage.removeItem("offlineMode");
      });
    }
  }
}
