import { makeAutoObservable } from "mobx";

import { translations as en } from "../constants/languages/en";
import { translations as pl } from "../constants/languages/pl";
import { ITranslations } from "../types/languages";

import { RootStore } from "./Root.store";

export const languagesOptions = ["en", "pl"] as const;
type languages = (typeof languagesOptions)[number];
const languagesList: { [key in languages]: ITranslations } = { en, pl };

export class TranslationsStore {
  rootStore: RootStore;
  translations: ITranslations = en;
  language: languages = "en";

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
    this.loadLanguageFromLocalStorage();
  }

  setLanguage(language: languages): void {
    this.language = language;
    this.translations = {
      ...languagesList["en"],
      ...languagesList[language],
    };

    this.cacheLanguageInLocalStorage();
  }

  cacheLanguageInLocalStorage(): void {
    localStorage.setItem("language", this.language);
  }

  loadLanguageFromLocalStorage(): void {
    const language = localStorage.getItem("language") as languages;
    if (language === "en" || language === "pl") {
      this.setLanguage(language);
    }
  }
}
