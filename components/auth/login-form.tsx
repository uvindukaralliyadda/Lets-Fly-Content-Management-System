"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface LoginErrors {
  username?: string;
  password?: string;
}

function getErrorMessage(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }
  return null;
}

export default function LoginForm() {
  const router = useRouter();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const nextErrors: LoginErrors = {};
    setErrors(nextErrors);
    setNotice("");

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.username) usernameRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/demo-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result) ?? "Demo sign-in could not be completed.",
        );
      }

      setNotice("Demo sign-in successful. Opening the CMS…");
      router.replace("/cms");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Demo sign-in could not be completed. Please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <>
      <div className="bg" aria-hidden="true" />
      <main className="page">
        <header className="brand">
          <div className="logo" aria-label="Let's Fly.lk">
            Let&apos;sFly
          </div>
          <span className="tag">Staff Gateway</span>
          <h1>Welcome to the Management Portal</h1>
          <p>Manage your travel business from one place.</p>
        </header>

        <div className="stack">
          <section className="cms" aria-labelledby="cms-title">
            <div className="cms-head">
              <div className="cms-ic" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h2 id="cms-title">
                CMS Login<span>Main</span>
              </h2>
            </div>
            <p>Sign in to manage your website content and travel products.</p>
            <p className="demo-label">
              Demo mode: any non-empty username and password will sign you in.
            </p>

            <form id="cmsForm" noValidate onSubmit={handleSubmit}>
              <div className={`field${errors.username ? " invalid" : ""}`}>
                <label htmlFor="user">Email / Username</label>
                <div className="control">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>
                  <input
                    autoComplete="username"
                    id="user"
                    name="user"
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        username: undefined,
                      }));
                    }}
                    placeholder="you@letsfly.lk"
                    ref={usernameRef}
                    required
                    type="text"
                    value={username}
                    aria-invalid={Boolean(errors.username)}
                    aria-describedby="user-err"
                  />
                </div>
                <span className="err-msg" id="user-err">
                  {errors.username ?? "Please enter your email or username."}
                </span>
              </div>

              <div className={`field${errors.password ? " invalid" : ""}`}>
                <label htmlFor="pass">Password</label>
                <div className="control">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  <input
                    autoComplete="current-password"
                    id="pass"
                    name="pass"
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        password: undefined,
                      }));
                    }}
                    placeholder="Enter your password"
                    ref={passwordRef}
                    required
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby="pass-err"
                  />
                  <button
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                    aria-pressed={passwordVisible}
                    className="toggle-pw"
                    onClick={() => {
                      setPasswordVisible((visible) => !visible);
                      passwordRef.current?.focus();
                    }}
                    type="button"
                  >
                    <svg
                      className="show"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg
                      className="hide"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.1-5.9M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" />
                    </svg>
                  </button>
                </div>
                <span className="err-msg" id="pass-err">
                  {errors.password ?? "Please enter your password."}
                </span>
              </div>

              <div className="row">
                <label className="remember">
                  <input
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    type="checkbox"
                  />
                  Keep me signed in
                </label>
              </div>

              <button
                className={`btn-signin${busy ? " loading" : ""}`}
                disabled={busy}
                id="signIn"
                type="submit"
              >
                {busy ? (
                  <>
                    <span className="spinner" />
                    <span>Checking…</span>
                  </>
                ) : (
                  <>
                    <span className="lbl">Sign In</span>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>

              <a
                className="forgot"
                href="#forgot"
                onClick={(event) => {
                  event.preventDefault();
                  setNotice(
                    "Password reset is not connected in this demo. Please contact your system administrator.",
                  );
                }}
              >
                Forgot Password?
              </a>
            </form>

            <div
              className={`notice${notice ? " show" : ""}`}
              id="notice"
              role="status"
              aria-live="polite"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
              <span>{notice}</span>
            </div>

            <div className="secure">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Authorised Let&apos;s Fly staff only
            </div>
          </section>

          <div className="systems-label">Other systems</div>
          <div className="systems">
            <article className="sys">
              <div className="sys-ic" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <path d="M8 6h8M8 10h8M8 14h2M14 14h2M8 18h2M14 18h2" />
                </svg>
              </div>
              <h3>Accounts Management</h3>
              <p>Manage financial records, invoices and accounting operations.</p>
              <a className="sys-link" href="https://accounts.example.com">
                Access Accounts
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </article>
            <article className="sys">
              <div className="sys-ic" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
                  <circle cx="17.5" cy="9" r="2.5" />
                  <path d="M16 14.2A5 5 0 0 1 21.5 19" />
                </svg>
              </div>
              <h3>Human Resources</h3>
              <p>Manage employees, HR records and internal HR operations.</p>
              <a className="sys-link" href="https://hr.example.com">
                Access HR
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </article>
          </div>
        </div>

        <footer className="foot">
          <span>© 2026 Let&apos;s Fly.lk · Internal use only</span>
          <span className="dot" />
          <a href="https://letsfly.lk">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Back to website
          </a>
          <span className="dot" />
          <a href="mailto:inquiry@letsfly.lk">IT support</a>
        </footer>
      </main>
    </>
  );
}
