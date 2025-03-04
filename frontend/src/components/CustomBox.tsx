import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export const CustomBox = (props: JSX.IntrinsicElements['mesh']) => {
  // This reference will give us direct access to the THREE.Mesh object
  const mesh = useRef<THREE.Mesh>(null!)

  // Hold state for hovered and clicked events
  // const [hovered, hover] = useState(false)
  // const [clicked, click] = useState(false)

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {
    mesh.current.rotation.x += 0.01
    mesh.current.rotation.y += 0.01
    mesh.current.rotation.z += 0.01
  })

  console.log('props:', props)

  return (
    <mesh
      {...props}
      ref={mesh}
      // scale={clicked ? 1.5 : 1}
      // onClick={() => click(!clicked)}
      // onPointerOver={() => hover(true)}
      // onPointerOut={() => hover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={'grey'} />

      {/* <meshStandardMaterial color={hovered ? 'red' : 'lightGrey'} /> */}
    </mesh>
  )
}
