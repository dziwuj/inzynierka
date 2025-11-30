import { useEffect, useRef, useState } from "react";

import { authApi } from "@/api/auth";

type VerificationStatus = "loading" | "success" | "error";

export const useEmailVerification = (token: string | null) => {
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      // Prevent duplicate API calls (React StrictMode, browser prefetch, etc.)
      if (hasVerified.current) {
        return;
      }
      hasVerified.current = true;

      try {
        const response = await authApi.verifyEmail(token);
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      }
    };

    verifyEmail();
  }, [token]);

  return { status, message };
};
