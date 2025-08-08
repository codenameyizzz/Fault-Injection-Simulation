// frontend/src/pages/Jonathan/wear_pathology/run.js

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WearPathologyRun() {
  const router = useRouter();
  const fault = "wear_pathology";

  // Which field to sweep
  const options = [
    { key: "WEAR_PCT", label: "Hot-channel injection rate (%)" },
    { key: "WEAR_MIN_US", label: "Min hot-channel delay (µs)" },
    { key: "WEAR_MAX_US", label: "Max hot-channel delay (µs)" },
    { key: "NCHANNELS", label: "Total SSD channels" },
    { key: "MAX_HOT_CHANNELS", label: "Number of congested channels" },
  ];

  // Sweep‐range state
  const [param, setParam] = useState(options[0].key);
  const [start, setStart] = useState(0);
  const [step, setStep] = useState(1);
  const [end, setEnd] = useState(100);

  // Fixed settings for the others
  const [wearPct, setWearPct] = useState(5);
  const [minUs, setMinUs] = useState(10);
  const [maxUs, setMaxUs] = useState(100);
  const [nChannels, setNChannels] = useState(16);
  const [maxHot, setMaxHot] = useState(1);

  const fixed = options.filter((o) => o.key !== param);
  const getValue = (k) => {
    switch (k) {
      case "WEAR_PCT":
        return wearPct;
      case "WEAR_MIN_US":
        return minUs;
      case "WEAR_MAX_US":
        return maxUs;
      case "NCHANNELS":
        return nChannels;
      case "MAX_HOT_CHANNELS":
        return maxHot;
    }
  };
  const getSetter = (k) => {
    switch (k) {
      case "WEAR_PCT":
        return setWearPct;
      case "WEAR_MIN_US":
        return setMinUs;
      case "WEAR_MAX_US":
        return setMaxUs;
      case "NCHANNELS":
        return setNChannels;
      case "MAX_HOT_CHANNELS":
        return setMaxHot;
    }
  };

  function handleRun() {
    const label = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);
    const qp = new URLSearchParams({ fault, param, start, step, end, label });

    // extras for all non-swept knobs
    fixed.forEach((f) => {
      qp.append("extras", `${f.key}=${getValue(f.key)}`);
    });

    router.push(`/Jonathan/wear_pathology/stream?${qp.toString()}`);
  }

  return (
    <div className="container py-4">
      <h3>Wear Pathology Sweep</h3>

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
        {fixed.map((f) => (
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
