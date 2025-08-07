"use client";

import { useRouter } from "next/router";
import { useState } from "react";

export default function MediaRetriesRun() {
  const router = useRouter();
  const fault = "media_retries";

  // Which field to sweep
  const options = [
    { key: "INJECT_PCT", label: "Injection Probability (%)" },
    { key: "MAX_MEDIA_RETRIES", label: "Max Retries per Error" },
    { key: "MEDIA_RETRY_DELAY_MS", label: "Retry Delay (ms)" },
  ];

  const [param, setParam] = useState(options[0].key);
  const [start, setStart] = useState(0);
  const [step, setStep] = useState(10);
  const [end, setEnd] = useState(100);

  // State for all three, but we'll only render two at a time
  const [injectPct, setInjectPct] = useState(5);
  const [maxRetries, setMaxRetries] = useState(1);
  const [retryDelayMs, setRetryDelayMs] = useState(1);

  function handleRun() {
    // 1) generate a unique run label timestamp
    const now = new Date();
    // e.g. "20250807123045"
    const label = now
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const qp = new URLSearchParams({ fault, param, start, step, end, label });

    // Only send extras for the two *not* swept
    if (param !== "INJECT_PCT") {
      qp.append("extras", `INJECT_PCT=${injectPct}`);
    }
    if (param !== "MAX_MEDIA_RETRIES") {
      qp.append("extras", `MAX_MEDIA_RETRIES=${maxRetries}`);
    }
    if (param !== "MEDIA_RETRY_DELAY_MS") {
      qp.append("extras", `MEDIA_RETRY_DELAY_MS=${retryDelayMs}`);
    }

    router.push(`/Jonathan/media_retries/stream?${qp.toString()}`);
  }

  // Which two fields to show as fixed
  const fixedFields = options.filter((o) => o.key !== param);

  // Helper to pick the right state and setter
  const getValue = (key) => {
    if (key === "INJECT_PCT") return injectPct;
    if (key === "MAX_MEDIA_RETRIES") return maxRetries;
    return retryDelayMs;
  };
  const getSetter = (key) => {
    if (key === "INJECT_PCT") return setInjectPct;
    if (key === "MAX_MEDIA_RETRIES") return setMaxRetries;
    return setRetryDelayMs;
  };

  return (
    <div className="container py-4">
      <h3>Media Retries Sweep</h3>

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

      {/* 3) Exactly two fixed settings */}
      <h5>Fixed Settings</h5>
      <div className="row g-3 mb-4">
        {fixedFields.map((field) => (
          <div className="col-md-6" key={field.key}>
            <label className="form-label">{field.label}</label>
            <input
              type="number"
              className="form-control"
              value={getValue(field.key)}
              onChange={(e) => getSetter(field.key)(+e.target.value)}
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
