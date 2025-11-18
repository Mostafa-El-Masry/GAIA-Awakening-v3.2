"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./PasswordProtection.module.css";

const PASSWORD = "1081991";
const AUTH_KEY = "gallery_auth";

interface PasswordProtectionProps {
  children: React.ReactNode;
}

export default function PasswordProtection({
  children,
}: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    try {
      const auth = sessionStorage.getItem(AUTH_KEY);
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.warn("Session storage not available:", e);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      try {
        sessionStorage.setItem(AUTH_KEY, "true");
        setIsAuthenticated(true);
        setError("");
      } catch (e) {
        console.warn("Failed to save auth state:", e);
      }
    } else {
      setError("Incorrect password");
      router.push("/");
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className={styles.authWrapper}>
      <div className={styles.galleryAuth}>
        <div className={styles.container}>
          <h2 className={styles.title}>Gallery Access</h2>
          <p className={styles.subtitle}>Enter the shared password to continue.</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={styles.input}
              autoFocus
              autoComplete="off"
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submit}>
              Enter Gallery
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
