// frontend/src/pages/experiments/run.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunExperiment() {
  const router = useRouter();
  const [faultType, setFaultType] = useState("firmware_tail");
  const [start, setStart] = useState(5);
  const [step, setStep] = useState(5);
  const [end, setEnd] = useState(30);
  const [diskId, setDiskId] = useState(2);
  const [slowCount, setSlowCount] = useState(10);
  const [delayMin, setDelayMin] = useState(100);
  const [delayMax, setDelayMax] = useState(1000);
  const [label, setLabel] = useState("");

  const run = () => {
    const lbl = label || `${faultType}_${start}-${end}pct`;

    // pindah ke halaman streaming dengan semua query params
    router.push({
      pathname: "/experiments/run-stream",
      query: {
        fault_type: faultType,
        start_pct: start,
        step_pct: step,
        end_pct: end,
        disk_id: diskId,
        slow_io_count: slowCount,
        delay_min_us: delayMin,
        delay_max_us: delayMax,
        label: lbl,
      },
    });
  };

  return (
    <div className="container py-4">
      <h3>Run Fault Experiment (Live)</h3>

      {/* Form input sama seperti sebelumnya */}
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <label>Fault Type</label>
          <select
            className="form-select"
            value={faultType}
            onChange={(e) => setFaultType(e.target.value)}
          >
            <option value="firmware_tail">Firmware Tail</option>
            <option value="raid_tail">RAID Tail</option>
            <option value="gc_slowness">GC Slowness</option>
          </select>
        </div>
        <div className="col-md-2">
          <label>Start %</label>
          <input
            type="number"
            className="form-control"
            value={start}
            onChange={(e) => setStart(+e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Step %</label>
          <input
            type="number"
            className="form-control"
            value={step}
            onChange={(e) => setStep(+e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>End %</label>
          <input
            type="number"
            className="form-control"
            value={end}
            onChange={(e) => setEnd(+e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label>Label (optional)</label>
          <input
            type="text"
            className="form-control"
            placeholder="auto-generated if blank"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-2">
          <label>Disk ID</label>
          <input
            type="number"
            className="form-control"
            value={diskId}
            onChange={(e) => setDiskId(+e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Slow IO Count</label>
          <input
            type="number"
            className="form-control"
            value={slowCount}
            onChange={(e) => setSlowCount(+e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label>Delay Min (µs)</label>
          <input
            type="number"
            className="form-control"
            value={delayMin}
            onChange={(e) => setDelayMin(+e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label>Delay Max (µs)</label>
          <input
            type="number"
            className="form-control"
            value={delayMax}
            onChange={(e) => setDelayMax(+e.target.value)}
          />
        </div>
      </div>

      <button className="btn btn-primary" onClick={run}>
        Run Live Experiment
      </button>
    </div>
  );
}
