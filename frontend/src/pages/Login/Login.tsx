import { type FC, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/stores/useStores";

import styles from "./Login.module.scss";

export const Login: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authStore } = useStores();

  const { error, loading, setError, login, loginWithGoogle, useOfflineMode } =
    useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setError("Google authentication failed. Please try again.");
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        authStore.setToken(token);
        authStore.setUser(user);
        navigate("/");
      } catch (err) {
        console.error("Failed to parse OAuth user data:", err);
        setError("Authentication failed. Please try again.");
      }
    }
  }, [searchParams, authStore, navigate, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({
      username: email,
      password,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>3D Model Viewer</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <Button variant="google" onClick={loginWithGoogle} disabled={loading}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <p className={styles.footer}>
          Don't have an account?{" "}
          <a href="/register" className={styles.link}>
            Sign up
          </a>
        </p>

        <div className={styles.offlineSection}>
          <Button variant="outline" onClick={useOfflineMode}>
            Continue Without Account
          </Button>
          <p className={styles.offlineNote}>
            Use the app offline with models stored locally on your device
          </p>
        </div>
      </div>
    </div>
  );
};
