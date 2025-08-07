// frontend/src/pages/Jonathan/media_retries/results.js

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const fault = sp.get("fault"); // e.g. "media_retries"
  const param = sp.get("param"); // e.g. "INJECT_PCT"
  const label = sp.get("label"); // e.g. "20250806101015"
  const api = process.env.NEXT_PUBLIC_API_URL;

  const [runs, setRuns] = useState(null);
  const [labels, setLabels] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fault) {
      setError("Missing `fault`");
      return;
    }

    // 1️⃣ only fault → fetch all (param,label) pairs
    if (!param && !label) {
      fetch(`${api}/Jonathan/analyze-sweep?fault=${fault}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
        .then((data) => setRuns(data.runs))
        .catch((e) => setError(e.toString()));
      return;
    }

    // 2️⃣ fault+param → fetch labels
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
        `${api}/Jonathan/analyze-sweep` +
          `?fault=${fault}&param=${param}&label=${label}`
      )
        .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
        .then((data) => setImgUrl(`${api}${data.url}`))
        .catch((e) => setError(e.toString()));
    }
  }, [fault, param, label, api]);

  if (error) {
    return <p className="text-danger">Error: {error}</p>;
  }

  // ❶ Pick which parameter to view
  if (!param && runs) {
    // dedupe param list
    const seen = new Set(),
      params = [];
    runs.forEach((r) => {
      if (!seen.has(r.param)) {
        seen.add(r.param);
        params.push(r.param);
      }
    });
    return (
      <div className="container py-4">
        <h3>Select parameter sweep for media retries</h3>
        <ul className="list-group">
          {params.map((p) => (
            <li key={p} className="list-group-item">
              <button
                className="btn btn-link"
                onClick={() =>
                  router.push(
                    `/Jonathan/media_retries/results?fault=${fault}&param=${p}`
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

  // ❷ Pick a timestamped run
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
                    `/Jonathan/media_retries/results` +
                      `?fault=${fault}&param=${param}&label=${lbl}`
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

  // ❸ Show the plot for that single run
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
