// frontend/src/pages/Jonathan/gc_pause/run.js
"use client";

import { useRouter } from "next/router";
import { useState } from "react";

export default function GCPauseRun() {
  const router = useRouter();
  const fault = "gc_pause";

  // Which field to sweep
  const options = [
    { key: "GC_INTERVAL_MS", label: "GC Interval (ms)" },
    { key: "GC_JITTER_MS", label: "GC Interval Jitter (±ms)" },
    { key: "GC_PAUSE_MIN_MS", label: "Min GC Pause (ms)" },
    { key: "GC_PAUSE_MAX_MS", label: "Max GC Pause (ms)" },
  ];

  // Sweep‐range state
  const [param, setParam] = useState(options[0].key);
  const [start, setStart] = useState(100);
  const [step, setStep] = useState(50);
  const [end, setEnd] = useState(500);

  // Fixed settings for the three knobs not being swept
  const [interval, setInterval] = useState(200);
  const [jitter, setJitter] = useState(20);
  const [pauseMin, setPauseMin] = useState(5);
  const [pauseMax, setPauseMax] = useState(50);

  function handleRun() {
    // Unique run label
    const label = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const qp = new URLSearchParams({ fault, param, start, step, end, label });

    // Extras = everything except the swept one
    if (param !== "GC_INTERVAL_MS")
      qp.append("extras", `GC_INTERVAL_MS=${interval}`);
    if (param !== "GC_JITTER_MS") qp.append("extras", `GC_JITTER_MS=${jitter}`);
    if (param !== "GC_PAUSE_MIN_MS")
      qp.append("extras", `GC_PAUSE_MIN_MS=${pauseMin}`);
    if (param !== "GC_PAUSE_MAX_MS")
      qp.append("extras", `GC_PAUSE_MAX_MS=${pauseMax}`);

    router.push(`/Jonathan/gc_pause/stream?${qp.toString()}`);
  }

  const fixedFields = options.filter((o) => o.key !== param);
  const getValue = (key) =>
    key === "GC_INTERVAL_MS"
      ? interval
      : key === "GC_JITTER_MS"
      ? jitter
      : key === "GC_PAUSE_MIN_MS"
      ? pauseMin
      : pauseMax;
  const getSetter = (key) =>
    key === "GC_INTERVAL_MS"
      ? setInterval
      : key === "GC_JITTER_MS"
      ? setJitter
      : key === "GC_PAUSE_MIN_MS"
      ? setPauseMin
      : setPauseMax;

  return (
    <div className="container py-4">
      <h3>GC Pause Sweep</h3>

      {/* 1) Sweep parameter selector */}
      <div className="mb-3">
        <label className="form-label">Parameter to sweep</label>
        <select
          className="form-select"
          value={param}
          onChange={(e) => setParam(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2) Sweep range */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <label className="form-label">Start</label>
          <input
            type="number"
            className="form-control"
            value={start}
            onChange={(e) => setStart(+e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Step</label>
          <input
            type="number"
            className="form-control"
            value={step}
            onChange={(e) => setStep(+e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">End</label>
          <input
            type="number"
            className="form-control"
            value={end}
            onChange={(e) => setEnd(+e.target.value)}
          />
        </div>
      </div>

      {/* 3) Fixed settings */}
      <h5>Fixed Settings</h5>
      <div className="row g-3 mb-4">
        {fixedFields.map((f) => (
          <div className="col-md-6" key={f.key}>
            <label className="form-label">{f.label}</label>
            <input
              type="number"
              className="form-control"
              value={getValue(f.key)}
              onChange={(e) => getSetter(f.key)(+e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={handleRun}>
        Start Sweep
      </button>
    </div>
  );
}
