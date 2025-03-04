import { observer } from 'mobx-react'
import { FC, FunctionComponent, useContext, useEffect, useState } from 'react'
import { HomeScreen } from '../screens/HomeScreen/HomeScreen'
import { StoreContext } from '../App'
import styled from 'styled-components'
import { dimensions } from '../theme/dimensions'
import { usePwa } from '../hooks/usePWA'

const RouterContainer = styled.div.attrs({ className: 'router' })<{ $isPwa?: boolean }>`
  /* padding: 32px 16px; */
  width: 100%;
  height: ${({ $isPwa }) =>
    `calc(100svh  - ${dimensions.barHeight} - ${dimensions.barHeight} - ${$isPwa ? '20px' : '0px'})`};
  max-height: ${({ $isPwa }) =>
    `calc(100svh  - ${dimensions.barHeight} - ${dimensions.barHeight} - ${$isPwa ? '20px' : '0px'})`};
  max-width: 600px;

  overflow-y: auto;
  overflow-x: hidden;
`

export const SCREENS = {
  home: HomeScreen,
}

export const ScreenRouter: FC = observer(() => {
  const store = useContext(StoreContext)
  const { isPwa } = usePwa()
  const { currentScreen } = store.AppState
  const [CurrentScreen, setCurrentScreen] = useState<FunctionComponent<{}>>(HomeScreen)

  useEffect(() => {
    setCurrentScreen(SCREENS[currentScreen])
  }, [currentScreen])

  return (
    <RouterContainer $isPwa={isPwa}>
      <CurrentScreen />
    </RouterContainer>
  )
})
