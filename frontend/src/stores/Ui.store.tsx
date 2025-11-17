import { makeAutoObservable } from "mobx";

import { RootStore } from "./Root.store";

export type Theme = "light" | "dark";

export class UiStore {
  rootStore: RootStore;
  theme: Theme = "light";

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
    this.restoreThemeFromLocalStorage();
    this.applyThemeToDOM();
  }

  setTheme(theme: Theme) {
    this.theme = theme;
    localStorage.setItem("theme", theme);
    this.applyThemeToDOM();
  }

  toggleTheme() {
    const nextTheme = this.theme === "light" ? "dark" : "light";
    this.setTheme(nextTheme);
  }

  restoreThemeFromLocalStorage() {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      this.theme = stored;
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      this.theme = prefersDark ? "dark" : "light";
    }
  }

  private applyThemeToDOM() {
    document.documentElement.setAttribute("data-theme", this.theme);
  }
}
