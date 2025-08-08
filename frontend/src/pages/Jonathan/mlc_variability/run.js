// frontend/src/pages/Jonathan/mlc_variability/run.js
"use client";

import { useRouter } from "next/router";
import { useState } from "react";

export default function MLcVariabilityRun() {
  const router = useRouter();
  const fault = "mlc_variability";

  // Which field to sweep
  const options = [
    { key: "SLOW_PAGE_RATE", label: "Slow‐Page Rate (%)" },
    { key: "MLC_SLOW_FACTOR", label: "Slow‐Page Factor (×)" },
  ];

  // Sweep‐range state
  const [param, setParam] = useState(options[0].key);
  const [start, setStart] = useState(0);
  const [step, setStep] = useState(1);
  const [end, setEnd] = useState(10);

  // Fixed setting for the non‐swept knob
  const [rate, setRate] = useState(5);
  const [factor, setFactor] = useState(2);

  function handleRun() {
    // Unique label YYYYMMDDhhmmss
    const label = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const qp = new URLSearchParams({ fault, param, start, step, end, label });

    // send the one non‐swept knob as extra
    if (param !== "SLOW_PAGE_RATE")
      qp.append("extras", `SLOW_PAGE_RATE=${rate}`);
    if (param !== "MLC_SLOW_FACTOR")
      qp.append("extras", `MLC_SLOW_FACTOR=${factor}`);

    router.push(`/Jonathan/mlc_variability/stream?${qp.toString()}`);
  }

  const fixed = options.filter((o) => o.key !== param);
  const getVal = (key) => (key === "SLOW_PAGE_RATE" ? rate : factor);
  const getSet = (key) => (key === "SLOW_PAGE_RATE" ? setRate : setFactor);

  return (
    <div className="container py-4">
      <h3>MLC Variability Sweep</h3>

      {/* 1) Sweep parameter */}
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

      {/* 3) Fixed setting */}
      <h5>Fixed Setting</h5>
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
