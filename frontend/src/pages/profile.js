"use client";

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import api from "@/api/api";

export default function ProfilePage() {
  const { user, loading, logout } = useContext(AuthContext);
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
  });
  const [saving, setSaving] = useState(false);

  // Jika belum load atau user null, jangan render form
  if (loading) return <p>Loading…</p>;
  if (!user) return <p>Please login to view profile.</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/auth/me/password", form);
      alert("Password changed successfully");
      setForm({ current_password: "", new_password: "" });
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-5">
      <h1 className="mb-4">My Profile</h1>

      <div className="mb-5">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>

      <hr />

      <h2 className="mt-4 mb-3">Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Current Password</label>
          <input
            type="password"
            className="form-control"
            value={form.current_password}
            onChange={(e) =>
              setForm({ ...form, current_password: e.target.value })
            }
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-control"
            value={form.new_password}
            onChange={(e) =>
              setForm({ ...form, new_password: e.target.value })
            }
            required
          />
        </div>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Change Password"}
        </button>
      </form>
    </div>
  );
}
