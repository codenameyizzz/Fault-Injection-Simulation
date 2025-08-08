// frontend/src/pages/Jonathan/gc_pause/results.js
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GCPauseResults() {
  const sp = useSearchParams();
  const router = useRouter();

  const fault = sp.get("fault"); // "gc_pause"
  const param = sp.get("param"); // e.g. "GC_INTERVAL_MS"
  const label = sp.get("label"); // e.g. "20250808123456"
  const api = process.env.NEXT_PUBLIC_API_URL;

  const [runs, setRuns] = useState(null);
  const [labels, setLabels] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fault) {
      setError("Missing `fault` in query");
      return;
    }

    // 1️⃣ only fault → list all (param,label) runs
    if (!param && !label) {
      fetch(`${api}/Jonathan/analyze-sweep?fault=${fault}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
        .then((data) => setRuns(data.runs))
        .catch((e) => setError(e.toString()));
      return;
    }

    // 2️⃣ fault+param → list labels for that param
    if (param && !label) {
      fetch(`${api}/Jonathan/analyze-sweep?fault=${fault}&param=${param}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
        .then((data) => setLabels(data.labels))
        .catch((e) => setError(e.toString()));
      return;
    }

    // 3️⃣ fault+param+label → fetch plot URL
    if (param && label) {
      fetch(
        `${api}/Jonathan/analyze-sweep?fault=${fault}&param=${param}&label=${label}`
      )
        .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
        .then((data) => setImgUrl(`${api}${data.url}`))
        .catch((e) => setError(e.toString()));
    }
  }, [fault, param, label, api]);

  if (error) return <p className="text-danger">Error: {error}</p>;

  // Step 1: pick which parameter sweep
  if (!param && runs) {
    // dedupe list of params
    const seen = new Set();
    const params = runs
      .map((r) => r.param)
      .filter((p) => !seen.has(p) && seen.add(p));
    return (
      <div className="container py-4">
        <h3>Select parameter for GC Pause</h3>
        <ul className="list-group">
          {params.map((p) => (
            <li key={p} className="list-group-item">
              <button
                className="btn btn-link"
                onClick={() =>
                  router.push(
                    `/Jonathan/gc_pause/results?fault=${fault}&param=${p}`
                  )
                }
              >
                {p}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Step 2: pick a timestamped run
  if (param && !label && labels) {
    return (
      <div className="container py-4">
        <h3>
          Select run for <code>{param}</code>
        </h3>
        <ul className="list-group">
          {labels.map((lbl) => (
            <li key={lbl} className="list-group-item">
              <button
                className="btn btn-link"
                onClick={() =>
                  router.push(
                    `/Jonathan/gc_pause/results?fault=${fault}&param=${param}&label=${lbl}`
                  )
                }
              >
                {lbl}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Step 3: show the one‐run plot
  if (param && label) {
    return (
      <div className="container py-4">
        <h3>
          CDF Plot: {fault.replace("_", " ")} / <code>{param}</code> (run{" "}
          {label})
        </h3>
        {imgUrl ? (
          <>
            <img src={imgUrl} alt="CDF Plot" className="img-fluid border" />
            <a href={imgUrl} download className="btn btn-outline-primary mt-3">
              Download PNG
            </a>
          </>
        ) : (
          <p>Loading plot…</p>
        )}
      </div>
    );
  }

  return <p>Loading…</p>;
}
