"use client";
import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(u, p);
      router.push("/dashboard");
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="d-flex vh-100 align-items-center justify-content-center bg-light">
      <form onSubmit={handleSubmit} className="border p-4 rounded bg-white">
        <h2 className="mb-4">Login</h2>
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Username"
          value={u}
          onChange={(e) => setU(e.target.value)}
          required
        />
        <input
          type="password"
          className="form-control mb-4"
          placeholder="Password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>
      </form>
    </div>
  );
}
