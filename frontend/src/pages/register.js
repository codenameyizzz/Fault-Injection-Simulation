import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, login } = useAuth(); // <- dari context

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
      await register(username, password);
      await login(username, password); // auto-login
      router.push("/dashboard");
    } catch {
      setError("Registrasi gagal. Username mungkin sudah digunakan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell auth-with-nav">
      <div className="container">
        <div className="text-center mb-4">
          <h1 className="auth-title font-heading fw-bold display-6 mb-2">Join Us</h1>
          <p className="auth-subtitle lead">
            Experience the extraordinary. Create your account to get started.
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
                autoComplete="new-password"
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
              {submitting ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center mt-4 mb-0 auth-bottom">
            Already have an account?{" "}
            <Link className="auth-link" href="/login">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
