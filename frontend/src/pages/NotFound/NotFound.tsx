import { type FC } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components";

import styles from "./NotFound.module.scss";

export const NotFound: FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>
          <span className={styles.four}>4</span>
          <span className={styles.zero}>0</span>
          <span className={styles.four}>4</span>
        </div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className={styles.actions}>
          <Button onClick={() => navigate("/")}>Go back</Button>
        </div>
      </div>
    </div>
  );
};
