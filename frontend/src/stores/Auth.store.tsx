import { makeAutoObservable, runInAction } from "mobx";

import { authApi } from "@/api/auth";
import type { User } from "@/types";

import { RootStore } from "./Root.store";

export class AuthStore {
  rootStore: RootStore;
  accessToken: string | null = null;
  user: User | null = null;
  isAuthenticated = false;
  loading = false;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
    this.loadFromStorage();
  }

  // Computed property that checks actual network status
  get isOfflineMode(): boolean {
    // If not authenticated, assume offline mode
    if (!this.isAuthenticated) {
      return true;
    }
    // Check actual network status
    return !navigator.onLine;
  }

  private loadFromStorage() {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("authUser");

    if (token && user) {
      this.accessToken = token;
      this.user = JSON.parse(user);
      this.isAuthenticated = true;
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

  async logout() {
    try {
      if (!this.isOfflineMode) {
        await authApi.logout();
      }
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      runInAction(() => {
        this.accessToken = null;
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      });
    }
  }
}
