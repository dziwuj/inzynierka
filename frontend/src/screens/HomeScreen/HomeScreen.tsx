import { observer } from 'mobx-react'
import { type FC, useContext } from 'react'
import { StoreContext } from '../../App'
import { ScreenContainer } from './HomeScreen.styles'
// import { usePwa } from '../../hooks/usePWA'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { CustomBox } from '@/components/CustomBox'

export const HomeScreen: FC = observer(() => {
  const store = useContext(StoreContext)
  const { title } = store.TranslationsState.translations.HomeScreen
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const { isPwa } = usePwa()

  return (
    <ScreenContainer>
      <h1>{title}</h1>
      <Canvas>
        <Stats />
        <spotLight position={[10, 10, 10]} angle={Math.PI / 2} penumbra={1} />
        <ambientLight intensity={2} />
        <directionalLight position={[0, 5, 0]} intensity={3} />
        <CustomBox position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
        <OrbitControls />
      </Canvas>
    </ScreenContainer>
  )
})
