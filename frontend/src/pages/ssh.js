"use client";

import { useState } from "react";
import api from "@/api/api";
import FileExplorer from "@/components/FileExplorer";

export default function SSHPage() {
  const [cwd, setCwd] = useState(".");
  const [cmd, setCmd] = useState("");
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");

  const runSSH = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/ssh", { command: cmd, cwd });
      setStdout(res.data.stdout);
      setStderr(res.data.stderr);
      setCwd(res.data.cwd);
    } catch (err) {
      setStdout("");
      setStderr(err.response?.data.detail || err.message);
    }
    setCmd("");
  };

  const viewFile = async (filename) => {
    // cat nama_file
    try {
      const res = await api.post("/ssh", { command: `cat "${cwd}/${filename}"`, cwd });
      setStdout(res.data.stdout);
      setStderr(res.data.stderr);
      // cwd tetap sama
    } catch (err) {
      setStdout("");
      setStderr(err.response?.data.detail || err.message);
    }
  };

  return (
    <div className="d-flex vh-100">
      {/* Sidebar */}
      <div className="bg-light border-end" style={{ width: "250px", overflowY: "auto" }}>
        <div className="p-3 border-bottom">
          <strong>Explorer</strong>
          <div className="small text-muted">Current: {cwd}</div>
        </div>
        <FileExplorer cwd={cwd} onChangeCwd={setCwd} onViewFile={viewFile}/>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4 d-flex flex-column">
        <form className="mb-3" onSubmit={runSSH}>
          <div className="input-group">
            <span className="input-group-text">{cwd}</span>
            <input
              type="text"
              className="form-control"
              placeholder="Command, e.g. ls -la"
              value={cmd}
              onChange={e => setCmd(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">Run</button>
          </div>
        </form>

        <div className="flex-grow-1 overflow-auto bg-dark text-light p-3 rounded">
          <pre>{stdout}</pre>
          {stderr && <pre className="text-danger">{stderr}</pre>}
        </div>
      </div>
    </div>
  );
}