import { AppStateStore } from './AppState.store'
import { TranslationsStore } from './TranslationsState.store'

export class RootStore {
  AppState: AppStateStore
  TranslationsState: TranslationsStore

  constructor() {
    this.AppState = new AppStateStore(this)
    this.TranslationsState = new TranslationsStore(this)
  }
}

export const rootStore = new RootStore()
