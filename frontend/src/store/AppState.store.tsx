import { action, makeAutoObservable } from 'mobx'
import { RootStore } from './Root.store'
import { SCREENS } from '../components/ScreenRouter'
import { DEV_MODE } from '../constants/envs'

export type Theme = 'light' | 'dark'

export class AppStateStore {
  DEV_MODE = DEV_MODE || false
  rootStore
  theme = 'light' as Theme
  currentScreen: keyof typeof SCREENS = 'home'
  prevScreen: keyof typeof SCREENS = 'home'

  constructor(rootStore: RootStore) {
    makeAutoObservable(this)
    this.rootStore = rootStore
    this.restoreThemeFromLocalStorage()
  }

  @action.bound setTheme(theme: Theme) {
    this.theme = theme
    localStorage.setItem('theme', theme)
  }

  @action.bound toggleTheme() {
    const theme = this.theme === 'light' ? 'dark' : 'light'
    this.theme = theme
    localStorage.setItem('theme', theme)
  }

  @action.bound restoreThemeFromLocalStorage() {
    const theme = localStorage.getItem('theme')
    if (theme === 'dark' || theme === 'light') {
      this.theme = theme as Theme
    }
  }

  @action.bound setCurrentScreen(screen: keyof typeof SCREENS) {
    this.prevScreen = this.currentScreen
    this.currentScreen = screen
  }
}
