"use client";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

export default function RunForm() {
  const router = useRouter();
  const { fault } = useParams();

  // Generic sweep inputs
  const [param, setParam] = useState("");
  const [start, setStart] = useState(0);
  const [step, setStep] = useState(1);
  const [end, setEnd] = useState(10);
  const [extras, setExtras] = useState("");

  const handleRun = () => {
    // extras entered as comma-separated list KEY=VAL,KEY=VAL
    const extraList = extras
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const query = new URLSearchParams({
      fault,
      param,
      start,
      step,
      end,
    });
    extraList.forEach((kv) => query.append("extras", kv));

    router.push(`/Jonathan/sweep-stream?${query.toString()}`);
  };

  return (
    <div className="container py-4">
      <h3>Run {fault.replace("_", " ")} Sweep</h3>
      <div className="mb-3">
        <label className="form-label">Param to Sweep</label>
        <input
          type="text"
          className="form-control"
          placeholder="e.g. INJECT_PCT or GC_INTERVAL_MS"
          value={param}
          onChange={(e) => setParam(e.target.value)}
        />
      </div>
      <div className="row g-3">
        <div className="col-md-2">
          <label>Start</label>
          <input
            type="number"
            className="form-control"
            value={start}
            onChange={(e) => setStart(+e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Step</label>
          <input
            type="number"
            className="form-control"
            value={step}
            onChange={(e) => setStep(+e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>End</label>
          <input
            type="number"
            className="form-control"
            value={end}
            onChange={(e) => setEnd(+e.target.value)}
          />
        </div>
      </div>
      <div className="mb-3 mt-3">
        <label className="form-label">Extra flags (comma-sep)</label>
        <input
          type="text"
          className="form-control"
          placeholder="e.g. INJECT_PCT=10,RANDOM_MAX_RETRIES=2"
          value={extras}
          onChange={(e) => setExtras(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" onClick={handleRun}>
        Start Sweep
      </button>
    </div>
  );
}
