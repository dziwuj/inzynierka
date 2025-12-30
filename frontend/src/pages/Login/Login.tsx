import { type FC, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/stores/useStores";

import styles from "./Login.module.scss";

import Logo from "@assets/icons/logo.svg";

export const Login: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authStore } = useStores();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { error, loading, setError, login, loginWithGoogle, useOfflineMode } =
    useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
        navigate("/dashboard");
      } catch (err) {
        console.error("Failed to parse OAuth user data:", err);
        setError("Authentication failed. Please try again.");
      }
    }
  }, [searchParams, authStore, navigate, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({
      username,
      password,
    });
  };

  // Check if offline/PWA mode is available
  const isOfflineAvailable = "serviceWorker" in navigator;

  return (
    <div className={styles.container}>
      {isOnline && (
        <div className={styles.loginSection}>
          <div className={styles.card}>
            <div className={styles.logoContainer}>
              <div className={styles.logo}>
                <img src={Logo} alt="3D Model Viewer Logo" />
              </div>
              <h2 className={styles.appName}>3D Model Viewer</h2>
            </div>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Sign in to your account</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.inputGroup}>
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  autoComplete="username"
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

            <Button
              variant="google"
              onClick={loginWithGoogle}
              disabled={loading}>
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
              <Link to="/register" className={styles.link}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      )}
      {isOfflineAvailable && (
        <div className={styles.offlineSection}>
          <div className={styles.offlineCard}>
            <div className={styles.offlineIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 13V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16 20L18 22L22 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className={styles.offlineTitle}>Use Offline</h2>
            <p className={styles.offlineDescription}>
              Access the 3D Model Viewer without an account. Your models will be
              stored locally on your device and available offline.
            </p>
            <ul className={styles.offlineFeatures}>
              <li>✓ No registration required</li>
              <li>✓ Works completely offline</li>
              <li>✓ Local storage only</li>
              <li>✓ Privacy-focused</li>
            </ul>
            <Button variant="primary" onClick={useOfflineMode}>
              Continue Without Account
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
