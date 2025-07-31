"use client";

import { useState } from "react";
import api from "@/api/api";

export default function SSHPage() {
  const [cmd, setCmd] = useState(""); // React state :contentReference[oaicite:6]{index=6}
  const [cwd, setCwd] = useState(".");
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");

  const runSSH = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/ssh", { command: cmd, cwd });
      setStdout(res.data.stdout);
      setStderr(res.data.stderr);
      setCwd(res.data.cwd); // update cwd in UI :contentReference[oaicite:7]{index=7}
    } catch (err) {
      setStdout("");
      setStderr(err.response?.data.detail || err.message);
    }
    setCmd("");
  };

  return (
    <div className="container mt-5">
      <h2>Remote SSH Executor</h2>
      <p>
        <strong>Current directory:</strong> {cwd}
      </p>
      <form onSubmit={runSSH}>
        <div className="mb-3">
          <label htmlFor="cmd" className="form-label">
            Command
          </label>
          <input
            id="cmd"
            className="form-control"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            placeholder="e.g. ls -la"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Run
        </button>
      </form>
      <pre className="mt-4">
        {stdout}
        {stderr && <span className="text-danger">Error: {stderr}</span>}
      </pre>
    </div>
  );
}
