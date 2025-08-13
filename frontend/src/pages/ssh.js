// src/pages/ssh.js
import { useEffect, useRef, useState } from "react";
import Protected from "../components/Protected";
import api from "../api/api";

export default function SSHPage() {
  return (
    <Protected>
      <SSHContent />
    </Protected>
  );
}

function SSHContent() {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const outRef = useRef(null);

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [output]);

  const run = async () => {
    if (!command.trim()) return;
    setRunning(true);
    setOutput((s) => (s ? s + "\n$ " + command + "\n" : "$ " + command + "\n"));
    try {
      // ⬇️ ganti { command } menjadi { cmd: command } kalau backend kamu begitu
      const { data } = await api.post("/ssh", { command });
      const text =
        typeof data === "string"
          ? data
          : data?.stdout || data?.message || JSON.stringify(data, null, 2);
      setOutput((s) => s + (text ?? "") + "\n");
    } catch (e) {
      setOutput((s) => s + (e?.message || "Error") + "\n");
    } finally {
      setRunning(false);
    }
  };

  const clearOut = () => setOutput("");

  const copyOut = async () => {
    try {
      await navigator.clipboard.writeText(output || "");
    } catch {}
  };

  return (
    <div className="container py-4">
      <section className="p-4 p-md-5 rounded-4 mb-4 border bg-body-tertiary">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <h1 className="h4 mb-1">SSH Console</h1>
            <p className="text-body-secondary mb-0">
              Execute commands on your provisioned nodes (Chameleon resources).
            </p>
          </div>
        </div>
      </section>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card card-elevated h-100">
            <div className="card-body">
              <label className="form-label fw-semibold">Command</label>
              <textarea
                className="form-control"
                rows={6}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g., docker ps -a"
              />
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={run} disabled={running}>
                  <i className="bi bi-play-fill me-1" />
                  {running ? "Running..." : "Run"}
                </button>
                <button className="btn btn-outline-secondary" onClick={() => setCommand("")} disabled={running}>
                  <i className="bi bi-eraser me-1" /> Clear cmd
                </button>
              </div>
              <p className="text-body-secondary small mt-3 mb-0">
                Tip: separate multiple commands with <code>&amp;&amp;</code> or use <code>;</code>.
              </p>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card card-elevated h-100">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="fw-semibold">Output</div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-secondary" onClick={copyOut}>
                    <i className="bi bi-clipboard me-1" /> Copy
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={clearOut}>
                    <i className="bi bi-trash3 me-1" /> Clear
                  </button>
                </div>
              </div>
              <pre
                ref={outRef}
                className="terminal-view flex-grow-1 mb-0"
                style={{
                  background: "#0b1020",
                  color: "#e5e7eb",
                  borderRadius: "12px",
                  padding: "14px",
                  overflow: "auto",
                  maxHeight: 360,
                }}
              >
{output || "Ready.\n"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
