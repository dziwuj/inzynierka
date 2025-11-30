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

  async login(username: string, password: string) {
    this.loading = true;
    try {
      const { data } = await authApi.login({ username, password });
      runInAction(() => {
        this.accessToken = data.token;
        this.user = data.user;
        this.isAuthenticated = true;
        this.setToken(data.token);
        this.setUser(data.user);
      });
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async refresh(): Promise<boolean> {
    try {
      const { data } = await authApi.refresh();
      runInAction(() => {
        this.accessToken = data.accessToken;
        this.isAuthenticated = true;
      });
      return true;
    } catch (error) {
      console.warn("Token refresh failed:", error);
      runInAction(() => {
        this.accessToken = null;
        this.isAuthenticated = false;
      });
      return false;
    }
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
        this.isOfflineMode = false;
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        localStorage.removeItem("offlineMode");
      });
    }
  }
}
