import { AuthStore } from "./Auth.store";
import { ModelsStore } from "./Models.store";
import { TranslationsStore } from "./Translations.store";
import { UiStore } from "./Ui.store";

export class RootStore {
  uiStore: UiStore;
  translationStore: TranslationsStore;
  authStore: AuthStore;
  modelsStore: ModelsStore;

  constructor() {
    this.uiStore = new UiStore(this);
    this.translationStore = new TranslationsStore(this);
    this.authStore = new AuthStore(this);
    this.modelsStore = new ModelsStore();
  }
}

export const rootStore = new RootStore();
