'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import styles from './login.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Authentication failed. Please verify your credentials.');
        setLoading(false);
        return;
      }

      setSuccessMessage('Authentication verified. Redirecting to Admin Dashboard...');
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 700);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage('Network or server connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.ambientHalo} />
      <div className={styles.ambientHaloBottom} />

      <main className={styles.loginCard}>
        <div className={styles.cardTopBar} />

        <div className={styles.cardHeader}>
          <div className={styles.logoWrapper}>
            <Image
              src="/images/nikkou-logo.png"
              alt="Nikkou Centre International Logo"
              width={270}
              height={85}
              priority
              className={styles.logoImg}
            />
          </div>

          <div className={styles.badgeTag}>
            <ShieldCheck size={14} />
            Institutional Portal
          </div>

          <h1 className={styles.title}>Admin Portal</h1>
          <p className={styles.titleJp}>Japanese Language School & Consultancy</p>
        </div>

        <div className={styles.formWrapper}>
          {errorMessage && (
            <div className={`${styles.alertBox} ${styles.alertError}`} role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className={`${styles.alertBox} ${styles.alertSuccess}`} role="alert">
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>
                Admin Username
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <User size={18} />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nikkou_admin"
                  required
                  className={styles.inputField}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className={styles.inputField}
                  disabled={loading}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.optionsRow}>
              <label className={styles.rememberLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={styles.checkbox}
                />
                Remember me
              </label>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? (
                <>
                  <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span>
                  Verifying Credentials...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          <div className={styles.footerNote}>
            © 2026 Nikkou Centre International. All Rights Reserved.
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
