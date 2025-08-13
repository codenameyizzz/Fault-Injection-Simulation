// src/components/Navbar.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const isActive = (href) => {
    // match prefix agar /experiments/* juga aktif
    if (href === "/") return router.pathname === "/";
    return router.pathname === href || router.pathname.startsWith(href + "/");
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav id="app-navbar" className="navbar navbar-expand-lg sticky-top nav-glass py-2">
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold">
          <i className="bi bi-lightning-charge-fill text-primary" />
          <span>Fault-Injection <span className="text-primary">Simulation</span></span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
          aria-controls="navbarMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarMain">
          {/* left links */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link href="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active fw-semibold" : ""}`}>
                <i className="bi bi-speedometer2 me-1" /> Dashboard
              </Link>
            </li>
            <li className="nav-item dropdown">
              <a
                className={`nav-link dropdown-toggle ${isActive("/experiments") ? "active fw-semibold" : ""}`}
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-beaker me-1" /> Experiments
              </a>
              <ul className="dropdown-menu shadow-sm">
                <li>
                  <Link className="dropdown-item" href="/experiments">
                    <i className="bi bi-clock-history me-2" />
                    History
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/experiments/run">
                    <i className="bi bi-play-circle me-2" />
                    New Run
                  </Link>
                </li>
              </ul>
            </li>
            <li className="nav-item">
              <Link href="/Jonathan" className={`nav-link ${isActive("/Jonathan") ? "active fw-semibold" : ""}`}>
                <i className="bi bi-hdd-network me-1" /> Faults set
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/ssh" className={`nav-link ${isActive("/ssh") ? "active fw-semibold" : ""}`}>
                <i className="bi bi-terminal me-1" /> SSH
              </Link>
            </li>
          </ul>

          {/* right actions */}
          <div className="d-flex align-items-center gap-2">
            <Link href="/experiments/run" className="btn btn-primary btn-sm rounded-pill">
              <i className="bi bi-play-fill me-1" />
              New Run
            </Link>

            <div className="vr d-none d-lg-block mx-1 opacity-25" />

            {user ? (
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary btn-sm dropdown-toggle rounded-pill px-3"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-person-circle me-1" />
                  {user.username || "User"}
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                  <li>
                    <Link className="dropdown-item" href="/profile">
                      <i className="bi bi-gear me-2" />
                      Profile & Settings
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2" />
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link className="btn btn-outline-secondary btn-sm" href="/login">Login</Link>
                <Link className="btn btn-primary btn-sm" href="/register">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
