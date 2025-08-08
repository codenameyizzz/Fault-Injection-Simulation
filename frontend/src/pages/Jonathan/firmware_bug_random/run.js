// frontend/src/pages/Jonathan/firmware_bug_random/run.js

"use client";

import { useRouter } from "next/router";
import { useState } from "react";

export default function FirmwareBugRandomRun() {
  const router = useRouter();
  const fault = "firmware_bug_random";

  // Which field to sweep
  const options = [
    { key: "INJECT_PCT", label: "Injection Probability (%)" },
    { key: "RANDOM_MAX_DELAY_MS", label: "Random Delay (ms)" },
    { key: "RANDOM_MAX_RETRIES", label: "Random Retries" },
  ];

  // Sweep‐range state
  const [param, setParam] = useState(options[0].key);
  const [start, setStart] = useState(0);
  const [step, setStep] = useState(1);
  const [end, setEnd] = useState(5);

  // Fixed settings for the two knobs not being swept
  const [injectPct, setInjectPct] = useState(5);
  const [randomDelay, setRandomDelay] = useState(10);
  const [randomRetries, setRandomRetries] = useState(1);

  function handleRun() {
    // Unique timestamp label: YYYYMMDDhhmmss
    const label = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const qp = new URLSearchParams({ fault, param, start, step, end, label });

    // Send the two non-swept settings as extras
    if (param !== "INJECT_PCT") qp.append("extras", `INJECT_PCT=${injectPct}`);
    if (param !== "RANDOM_MAX_DELAY_MS")
      qp.append("extras", `RANDOM_MAX_DELAY_MS=${randomDelay}`);
    if (param !== "RANDOM_MAX_RETRIES")
      qp.append("extras", `RANDOM_MAX_RETRIES=${randomRetries}`);

    router.push(`/Jonathan/firmware_bug_random/stream?${qp.toString()}`);
  }

  // Which fields are fixed (everything except the swept one)
  const fixed = options.filter((o) => o.key !== param);
  const getVal = (key) =>
    key === "INJECT_PCT"
      ? injectPct
      : key === "RANDOM_MAX_DELAY_MS"
      ? randomDelay
      : randomRetries;
  const getSet = (key) =>
    key === "INJECT_PCT"
      ? setInjectPct
      : key === "RANDOM_MAX_DELAY_MS"
      ? setRandomDelay
      : setRandomRetries;

  return (
    <div className="container py-4">
      <h3>Firmware Bug Random Sweep</h3>

      {/* 1) Choose sweep parameter */}
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
        {fixed.map((f) => (
          <div className="col-md-6" key={f.key}>
            <label className="form-label">{f.label}</label>
            <input
              type="number"
              className="form-control"
              value={getVal(f.key)}
              onChange={(e) => getSet(f.key)(+e.target.value)}
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
