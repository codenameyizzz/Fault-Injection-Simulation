"use client";
import Link from "next/link";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link href="/" className="navbar-brand">
          Fault-Injection Simulation
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {user && (
              <>
                <li className="nav-item">
                  <Link href="/dashboard" className="nav-link">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/experiments" className="nav-link">
                    Experiments
                  </Link>
                </li>
                {user?.role === "mentor" && (
                  <li className="nav-item">
                    <Link href="/reviews" className="nav-link">
                      Reviews
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link href="/jobs" className="nav-link">
                    Jobs
                  </Link>
                </li>
                {/* New SSH link */}
                <li className="nav-item">
                  <Link href="/ssh" className="nav-link">
                    SSH
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/Jonathan" className="nav-link">
                    Jonathan
                  </Link>
                </li>
              </>
            )}
          </ul>

          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {!user ? (
              <>
                <li className="nav-item">
                  <Link href="/login" className="nav-link">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/register" className="nav-link">
                    Register
                  </Link>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <button className="btn btn-outline-light" onClick={logout}>
                  Logout
                </button>
              </li>
            )}
            <li className="nav-item">
              <Link href="/profile" className="nav-link">
                Profile
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
