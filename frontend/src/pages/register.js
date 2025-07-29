"use client";
import { useState } from "react";
import api from "@/api/api";
import { useRouter } from "next/navigation";

export default function Register() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", { username: u, password: p });
      alert("Registered! Please login.");
      router.push("/login");
    } catch (err) {
      alert(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="d-flex vh-100 align-items-center justify-content-center bg-light">
      <form onSubmit={submit} className="border p-4 rounded bg-white">
        <h2 className="mb-4">Register</h2>
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
        <button type="submit" className="btn btn-success w-100">
          Register
        </button>
      </form>
    </div>
  );
}
