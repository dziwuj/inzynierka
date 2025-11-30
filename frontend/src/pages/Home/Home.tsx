import { type FC } from "react";
import { OrbitControls, Stats } from "@react-three/drei";
// import { usePwa } from '../../hooks/usePWA'
import { Canvas } from "@react-three/fiber";
import { observer } from "mobx-react";
import { useNavigate } from "react-router-dom";

import { CustomBox } from "@/components/CustomBox/CustomBox";
import { useStores } from "@/stores/useStores";

import styles from "./Home.module.scss";

export const Home: FC = observer(() => {
  const store = useStores();
  const navigate = useNavigate();
  const { translations } = store.translationStore;
  const { authStore } = store;
  const { title } = translations.HomeScreen;

  // const { isPwa } = usePwa()

  const handleLogout = async () => {
    await authStore.logout();
    navigate("/login");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
      <Canvas className={styles.canvas}>
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
