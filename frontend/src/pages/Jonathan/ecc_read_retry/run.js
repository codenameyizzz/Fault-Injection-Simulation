// frontend/src/pages/Jonathan/ecc_read_retry/run.js
"use client";

import { useRouter } from "next/router";
import { useState } from "react";

export default function EccReadRetryRun() {
  const router = useRouter();
  const fault = "ecc_read_retry";

  // Which field to sweep
  const options = [
    { key: "ECC_ERROR_PCT", label: "Error Rate (%)" },
    { key: "MAX_ECC_RETRIES", label: "Max ECC Retries" },
    { key: "MIN_ECC_DELAY_US", label: "Min Delay (µs)" },
    { key: "MAX_ECC_DELAY_US", label: "Max Delay (µs)" },
  ];

  // Sweep‐range state
  const [param, setParam] = useState(options[0].key);
  const [start, setStart] = useState(0);
  const [step, setStep] = useState(1);
  const [end, setEnd] = useState(5);

  // Fixed settings for the non‐swept knobs
  const [errorRate, setErrorRate] = useState(1);
  const [maxRetries, setMaxRetries] = useState(1);
  const [minDelay, setMinDelay] = useState(100);
  const [maxDelay, setMaxDelay] = useState(1000);

  function handleRun() {
    // Unique timestamp label: YYYYMMDDhhmmss
    const label = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const qp = new URLSearchParams({ fault, param, start, step, end, label });

    // Send extras for every knob not swept
    if (param !== "ECC_ERROR_PCT")
      qp.append("extras", `ECC_ERROR_PCT=${errorRate}`);
    if (param !== "MAX_ECC_RETRIES")
      qp.append("extras", `MAX_ECC_RETRIES=${maxRetries}`);
    if (param !== "MIN_ECC_DELAY_US")
      qp.append("extras", `MIN_ECC_DELAY_US=${minDelay}`);
    if (param !== "MAX_ECC_DELAY_US")
      qp.append("extras", `MAX_ECC_DELAY_US=${maxDelay}`);

    router.push(`/Jonathan/ecc_read_retry/stream?${qp.toString()}`);
  }

  // Which knobs are fixed (everything except the swept one)
  const fixed = options.filter((o) => o.key !== param);
  const getVal = (key) =>
    key === "ECC_ERROR_PCT"
      ? errorRate
      : key === "MAX_ECC_RETRIES"
      ? maxRetries
      : key === "MIN_ECC_DELAY_US"
      ? minDelay
      : maxDelay;
  const getSet = (key) =>
    key === "ECC_ERROR_PCT"
      ? setErrorRate
      : key === "MAX_ECC_RETRIES"
      ? setMaxRetries
      : key === "MIN_ECC_DELAY_US"
      ? setMinDelay
      : setMaxDelay;

  return (
    <div className="container py-4">
      <h3>ECC Read Retry Sweep</h3>

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
        {[
          { lbl: "Start", val: start, setter: setStart },
          { lbl: "Step", val: step, setter: setStep },
          { lbl: "End", val: end, setter: setEnd },
        ].map(({ lbl, val, setter }) => (
          <div className="col-md-4" key={lbl}>
            <label className="form-label">{lbl}</label>
            <input
              type="number"
              className="form-control"
              value={val}
              onChange={(e) => setter(+e.target.value)}
            />
          </div>
        ))}
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
