"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import api from "@/api/api";

export default function RunExperimentPage() {
  const router = useRouter();
  // Kita bisa ambil query param ?id=… jika mau integrasi dengan list
  // or gunakan static/dynamic route nanti
  const [delay, setDelay]       = useState("35ms");
  const [ops, setOps]           = useState(120);
  const [label, setLabel]       = useState("slowleader_mid2end35ms");
  const [faultTime, setFaultTime] = useState(60);

  const [status, setStatus]     = useState("");
  const [chart, setChart]       = useState("");

  const handleRun = async () => {
    setStatus("Running experiment…");
    try {
      // 1. Run remote script
      await api.post("/experiments/run", {
        delay,
        ops,
        label,
        fault_time: faultTime,
      });

      setStatus("Fetching logs…");
      // 2. Fetch & download logs
      await api.get(`/experiments/logs/${label}`);

      setStatus("Analyzing & plotting…");
      // 3. Analyze & ambil chart base64
      const res = await api.get(`/experiments/analyze/${label}`);
      setChart(res.data.chart);

      setStatus("Done!");
    } catch (e) {
      setStatus("Error: " + (e.response?.data.detail || e.message));
    }
  };

  return (
    <div className="container py-5">
      <h2>Run & Visualize Experiment</h2>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="form-label">Delay</label>
          <select
            className="form-select"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
          >
            {["0ms", "1ms", "10ms", "35ms"].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label">Ops</label>
          <input
            type="number"
            className="form-control"
            value={ops}
            onChange={(e) => setOps(+e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Label</label>
          <input
            type="text"
            className="form-control"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Fault Time (s)</label>
          <input
            type="number"
            className="form-control"
            value={faultTime}
            onChange={(e) => setFaultTime(+e.target.value)}
          />
        </div>
        <div className="col-md-1 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={handleRun}>
            Run
          </button>
        </div>
      </div>

      <p><strong>Status:</strong> {status}</p>

      {chart && (
        <div className="mt-4">
          <h4>Result Chart</h4>
          <img
            src={chart}
            alt="Experiment Chart"
            className="img-fluid border rounded"
          />
        </div>
      )}
    </div>
  );
}
