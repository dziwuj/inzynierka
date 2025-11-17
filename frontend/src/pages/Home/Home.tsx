import { type FC } from "react";
import { OrbitControls, Stats } from "@react-three/drei";
// import { usePwa } from '../../hooks/usePWA'
import { Canvas } from "@react-three/fiber";
import { observer } from "mobx-react";

import { CustomBox } from "@/components/CustomBox/CustomBox";
import { useStores } from "@/stores/useStores";

export const Home: FC = observer(() => {
  const store = useStores();
  const { translations } = store.translationStore;
  const { title } = translations.HomeScreen;

  // const { isPwa } = usePwa()

  return (
    <div>
      <h1>{title}</h1>
      <Canvas>
        <Stats />
        <spotLight position={[10, 10, 10]} angle={Math.PI / 2} penumbra={1} />
        <ambientLight intensity={2} />
        <directionalLight position={[0, 5, 0]} intensity={3} />
        <CustomBox position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
        <OrbitControls />
      </Canvas>
    </div>
  );
});
