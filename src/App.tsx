import React, { type ReactElement } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { CustomBox } from './components/CustomBox'

const App = (): ReactElement => {
    return (
        <Canvas>
            <Stats />
            <ambientLight intensity={0.7} />
            <spotLight
                position={[10, 10, 10]}
                angle={Math.PI / 2}
                penumbra={1}
            />
            <pointLight position={[-10, -10, -10]} />
            <CustomBox position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
            <OrbitControls />
        </Canvas>
    )
}

export default App
