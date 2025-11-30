import { type FC } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useEmailVerification } from "@/hooks/useEmailVerification";

import styles from "./VerifyEmail.module.scss";

export const VerifyEmail: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { status, message } = useEmailVerification(token);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === "loading" && (
          <>
            <div className={styles.spinner}></div>
            <h1>Verifying Your Email...</h1>
            <p>Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={styles.successIcon}>✓</div>
            <h1>Email Verified!</h1>
            <p>{message}</p>
            <button
              className={styles.button}
              onClick={() => navigate("/login")}>
              Continue to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <h1>Verification Failed</h1>
            <p className={styles.error}>{message}</p>
            <button
              className={styles.button}
              onClick={() => navigate("/login")}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};
