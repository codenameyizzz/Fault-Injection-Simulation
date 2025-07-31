// frontend/pages/ssh.js

import { useState } from "react";
import api from "@/api/api";

export default function SSHPage() {
  const [cmd, setCmd] = useState("");
  const [output, setOutput] = useState(null);

  const runSSH = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/ssh", { command: cmd });
      setOutput(res.data);
    } catch (err) {
      setOutput({
        stdout: "",
        stderr: err.response?.data.detail || err.message,
      });
    }
  };

  return (
    <div className="container mt-5">
      <h2>Remote SSH Executor</h2>
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

      {output && (
        <pre className="mt-4">
          {output.stdout}
          {output.stderr && (
            <span className="text-danger">Error: {output.stderr}</span>
          )}
        </pre>
      )}
    </div>
  );
}
