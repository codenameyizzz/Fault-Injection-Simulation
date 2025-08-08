// frontend/src/pages/Jonathan/firmware_throttle/run.js

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FirmwareThrottleRun() {
  const router = useRouter();
  const fault = "firmware_throttle";

  // Which field to sweep
  const options = [
    { key: "INJECT_PCT", label: "Throttle injection rate (%)" },
    { key: "MAX_THROTTLE_MUL", label: "Max throttle multiplier (N)" },
    { key: "REBOOT_CHANCE_PCT", label: "Reboot chance per I/O (%)" },
    { key: "MAX_REBOOT_HANG_S", label: "Max reboot hang (s)" },
  ];

  // Sweep‐range state
  const [param, setParam] = useState(options[0].key);
  const [start, setStart] = useState(0);
  const [step, setStep] = useState(1);
  const [end, setEnd] = useState(100);

  // Fixed settings for the three knobs not being swept
  const [injectPct, setInjectPct] = useState(10);
  const [maxThrottle, setMaxThrottle] = useState(1);
  const [rebootPct, setRebootPct] = useState(0);
  const [maxHang, setMaxHang] = useState(1);

  // Only show the non-swept inputs
  const fixedFields = options.filter((o) => o.key !== param);
  const getValue = (key) => {
    switch (key) {
      case "INJECT_PCT":
        return injectPct;
      case "MAX_THROTTLE_MUL":
        return maxThrottle;
      case "REBOOT_CHANCE_PCT":
        return rebootPct;
      case "MAX_REBOOT_HANG_S":
        return maxHang;
    }
  };
  const getSetter = (key) => {
    switch (key) {
      case "INJECT_PCT":
        return setInjectPct;
      case "MAX_THROTTLE_MUL":
        return setMaxThrottle;
      case "REBOOT_CHANCE_PCT":
        return setRebootPct;
      case "MAX_REBOOT_HANG_S":
        return setMaxHang;
    }
  };

  function handleRun() {
    // unique timestamp label
    const label = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const qp = new URLSearchParams({ fault, param, start, step, end, label });

    // extras = fixed knobs
    if (param !== "INJECT_PCT") qp.append("extras", `INJECT_PCT=${injectPct}`);
    if (param !== "MAX_THROTTLE_MUL")
      qp.append("extras", `MAX_THROTTLE_MUL=${maxThrottle}`);
    if (param !== "REBOOT_CHANCE_PCT")
      qp.append("extras", `REBOOT_CHANCE_PCT=${rebootPct}`);
    if (param !== "MAX_REBOOT_HANG_S")
      qp.append("extras", `MAX_REBOOT_HANG_S=${maxHang}`);

    // always include THROTTLE_UNIT_US so gcc gets it
    qp.append("extras", `THROTTLE_UNIT_US=250`);

    router.push(`/Jonathan/firmware_throttle/stream?${qp.toString()}`);
  }

  return (
    <div className="container py-4">
      <h3>Firmware Throttle Sweep</h3>

      {/* 1) Parameter selector */}
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
