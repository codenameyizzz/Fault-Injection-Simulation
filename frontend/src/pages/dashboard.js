"use client";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import Link from "next/link";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Welcome, {user?.username}!</h1>
      </div>
      <p>This portal lets you manage and run fault injection experiments.</p>
    </div>
  );
}
