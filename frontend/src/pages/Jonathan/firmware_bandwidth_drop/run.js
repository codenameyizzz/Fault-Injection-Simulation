// frontend/src/pages/Jonathan/firmware_bandwidth_drop/run.js

"use client";

import { useRouter } from "next/router";
import { useState } from "react";

export default function FirmwareBandwidthDropRun() {
  const router = useRouter();
  const fault = "firmware_bandwidth_drop";

  // Which field to sweep
  const options = [
    { key: "INJECT_PCT", label: "Injection Probability (%)" },
    { key: "FW_BW_FACTOR", label: "Bandwidth-Drop Factor" },
  ];

  // Sweep‐range state
  const [param, setParam] = useState(options[0].key);
  const [start, setStart] = useState(5);
  const [step, setStep] = useState(5);
  const [end, setEnd] = useState(10);

  // Fixed settings for the two knobs not being swept
  const [injectPct, setInjectPct] = useState(5);
  const [bwFactor, setBwFactor] = useState(1);

  function handleRun() {
    // Unique timestamp label: YYYYMMDDhhmmss
    const label = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const qp = new URLSearchParams({ fault, param, start, step, end, label });

    // always include THROTTLE_UNIT_US=250
    qp.append("extras", `THROTTLE_UNIT_US=250`);

    // extras = those two not being swept
    if (param !== "INJECT_PCT") qp.append("extras", `INJECT_PCT=${injectPct}`);
    if (param !== "FW_BW_FACTOR")
      qp.append("extras", `FW_BW_FACTOR=${bwFactor}`);

    router.push(`/Jonathan/firmware_bandwidth_drop/stream?${qp.toString()}`);
  }

  // Which fields are fixed (everything except the swept one)
  const fixed = options.filter((o) => o.key !== param);
  const getVal = (key) => (key === "INJECT_PCT" ? injectPct : bwFactor);
  const getSet = (key) => (key === "INJECT_PCT" ? setInjectPct : setBwFactor);

  return (
    <div className="container py-4">
      <h3>Firmware Bandwidth-Drop Sweep</h3>

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
