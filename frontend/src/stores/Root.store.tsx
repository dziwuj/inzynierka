import { AuthStore } from "./Auth.store";
import { TranslationsStore } from "./Translations.store";
import { UiStore } from "./Ui.store";

export class RootStore {
  uiStore: UiStore;
  translationStore: TranslationsStore;
  authStore: AuthStore;

  constructor() {
    this.uiStore = new UiStore(this);
    this.translationStore = new TranslationsStore(this);
    this.authStore = new AuthStore(this);
  }
}

export const rootStore = new RootStore();
