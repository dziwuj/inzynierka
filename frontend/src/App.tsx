import { createContext, FC, useContext } from 'react'
import { AppContainer } from './styles/App.styles'
import { GlobalStyles } from './styles/Global.styles'
import { Helmet } from './components/Helmet'
import { lightTheme } from './theme/light'
import { darkTheme } from './theme/dark'
import { ThemeProvider } from 'styled-components'
import { observer } from 'mobx-react'
import { rootStore } from './store/Root.store'
import { Theme } from './theme/theme'
import { ScreenRouter } from './components/ScreenRouter'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'

export const StoreContext = createContext(rootStore)

const themes = {
  light: lightTheme,
  dark: darkTheme,
}

const App: FC = observer(() => {
  const store = useContext(StoreContext)
  const { theme } = store.AppState

  return (
    <ThemeProvider theme={themes[theme] as Theme}>
      <AppContainer className="App">
        <Helmet title="inzynierka" description="inzynierka" />
        <GlobalStyles />
        <ScreenRouter />
        <PWAInstallPrompt />
      </AppContainer>
    </ThemeProvider>
  )
})

export default App
