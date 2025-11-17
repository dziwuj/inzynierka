import { makeAutoObservable, runInAction } from "mobx";

import { authApi } from "@/api/auth";

import { RootStore } from "./Root.store";

export class AuthStore {
  rootStore: RootStore;
  accessToken: string | null = null;
  isAuthenticated = false;
  loading = false;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  async login(email: string, password: string) {
    this.loading = true;
    try {
      const { data } = await authApi.login(email, password);
      runInAction(() => {
        this.accessToken = data.accessToken;
        this.isAuthenticated = true;
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
      await authApi.logout();
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      runInAction(() => {
        this.accessToken = null;
        this.isAuthenticated = false;
      });
    }
  }
}
