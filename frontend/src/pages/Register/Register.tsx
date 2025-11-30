import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components";
import { useAuth } from "@/hooks/useAuth";

import styles from "./Register.module.scss";

export const Register: FC = () => {
  const navigate = useNavigate();
  const { error, loading, register, resendVerification, loginWithGoogle } =
    useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    const result = await register({
      username,
      email,
      password,
      full_name: fullName || undefined,
    });

    if (result.success) {
      setRegisteredEmail(email);
      setVerificationSent(true);
    }
  };

  const handleResendVerification = async () => {
    const result = await resendVerification(registeredEmail);

    if (result.success) {
      alert(
        result.message || "Verification email resent! Please check your inbox.",
      );
    }
  };

  if (verificationSent) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Check Your Email</h1>
          <p>
            We've sent a verification link to <strong>{registeredEmail}</strong>
            . Please check your inbox and click the link to verify your email
            address.
          </p>
          <p className={styles.note}>
            The verification link will expire in 24 hours.
          </p>
          <div className={styles.form}>
            <Button onClick={handleResendVerification} disabled={loading}>
              {loading ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Sign up to get started</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {(error || localError) && (
            <div className={styles.error}>{localError || error}</div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={3}
              placeholder="Choose a username"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="fullName">Full Name (optional)</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
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
              placeholder="At least 8 characters"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter your password"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
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
          Sign up with Google
        </Button>

        <div className={styles.footer}>
          <p>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={styles.link}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
