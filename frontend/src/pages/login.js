import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth(); // <- ini kunci
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch {
      setError("Login gagal. Periksa kembali username & password Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell auth-with-nav">
      <div className="container">
        <div className="text-center mb-4">
          <h1 className="auth-title font-heading fw-bold display-6 mb-2">
            Welcome Back
          </h1>
          <p className="auth-subtitle lead">
            Your journey continues here. Log in to access your personalized experience.
          </p>
        </div>

        <div className="card-auth mx-auto">
          {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

          <form onSubmit={onSubmit} noValidate>
            <div className="mb-3">
              <input
                className="form-control auth-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-4 position-relative">
              <input
                type={showPwd ? "text" : "password"}
                className="form-control auth-input pe-5"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                title={showPwd ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showPwd ? "bi-eye-slash" : "bi-eye"}`} />
              </button>
            </div>

            <button type="submit" className="btn btn-auth-primary w-100" disabled={submitting}>
              {submitting ? "Signing in..." : "Log In"}
            </button>
          </form>

          <p className="text-center mt-4 mb-0 auth-bottom">
            Don&apos;t have an account?{" "}
            <Link className="auth-link" href="/register">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
