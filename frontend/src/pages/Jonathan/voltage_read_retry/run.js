// frontend/src/pages/Jonathan/voltage_read_retry/run.js

"use client";

import { useRouter } from "next/router";
import { useState } from "react";

export default function VoltageReadRetryRun() {
  const router = useRouter();
  const fault = "voltage_read_retry";

  // Which field to sweep
  const options = [
    { key: "INJECT_PCT", label: "Borderline-Cell Rate (%)" },
    { key: "RETRY_COUNT", label: "Max Read-Retry Count" },
    { key: "MIN_DELAY_US", label: "Min Retry Delay (µs)" },
    { key: "MAX_DELAY_US", label: "Max Retry Delay (µs)" },
  ];

  // Sweep‐range state
  const [param, setParam] = useState(options[0].key);
  const [start, setStart] = useState(0);
  const [step, setStep] = useState(1);
  const [end, setEnd] = useState(5);

  // State for the three fixed knobs
  const [injectPct, setInjectPct] = useState(5);
  const [retryCount, setRetryCount] = useState(1);
  const [minDelay, setMinDelay] = useState(10);
  const [maxDelay, setMaxDelay] = useState(100);

  function handleRun() {
    // Unique timestamp label: YYYYMMDDhhmmss
    const label = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const qp = new URLSearchParams({ fault, param, start, step, end, label });

    // Extras: every knob except the one being swept
    if (param !== "INJECT_PCT") qp.append("extras", `INJECT_PCT=${injectPct}`);
    if (param !== "RETRY_COUNT")
      qp.append("extras", `RETRY_COUNT=${retryCount}`);
    if (param !== "MIN_DELAY_US")
      qp.append("extras", `MIN_DELAY_US=${minDelay}`);
    if (param !== "MAX_DELAY_US")
      qp.append("extras", `MAX_DELAY_US=${maxDelay}`);

    router.push(`/Jonathan/voltage_read_retry/stream?${qp.toString()}`);
  }

  // Which fields are fixed
  const fixed = options.filter((o) => o.key !== param);
  const getVal = (key) => {
    switch (key) {
      case "INJECT_PCT":
        return injectPct;
      case "RETRY_COUNT":
        return retryCount;
      case "MIN_DELAY_US":
        return minDelay;
      case "MAX_DELAY_US":
        return maxDelay;
    }
  };
  const getSet = (key) => {
    switch (key) {
      case "INJECT_PCT":
        return setInjectPct;
      case "RETRY_COUNT":
        return setRetryCount;
      case "MIN_DELAY_US":
        return setMinDelay;
      case "MAX_DELAY_US":
        return setMaxDelay;
    }
  };

  return (
    <div className="container py-4">
      <h3>Voltage Read-Retry Sweep</h3>

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
