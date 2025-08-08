"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FirmwareBugRandomResults() {
  const sp = useSearchParams();
  const router = useRouter();
  const fault = sp.get("fault"); // firmware_bug_random
  const param = sp.get("param"); // e.g. RANDOM_MAX_RETRIES
  const label = sp.get("label"); // timestamp
  const api = process.env.NEXT_PUBLIC_API_URL;

  const [runs, setRuns] = useState(null);
  const [labels, setLabels] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!fault) {
      setErr("Missing `fault`");
      return;
    }
    // 1) only fault → list all (param,label)
    if (!param && !label) {
      fetch(`${api}/Jonathan/analyze-sweep?fault=${fault}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
        .then((js) => setRuns(js.runs))
        .catch((e) => setErr(e.toString()));
      return;
    }
    // 2) fault+param → list labels
    if (param && !label) {
      fetch(`${api}/Jonathan/analyze-sweep?fault=${fault}&param=${param}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
        .then((js) => setLabels(js.labels))
        .catch((e) => setErr(e.toString()));
      return;
    }
    // 3) all three → fetch plot
    if (param && label) {
      fetch(
        `${api}/Jonathan/analyze-sweep?fault=${fault}&param=${param}&label=${label}`
      )
        .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
        .then((js) => setImgUrl(`${api}${js.url}`))
        .catch((e) => setErr(e.toString()));
    }
  }, [fault, param, label, api]);

  if (err) return <p className="text-danger">Error: {err}</p>;

  // Pick a parameter sweep
  if (!param && runs) {
    const unique = Array.from(new Set(runs.map((r) => r.param)));
    return (
      <div className="container py-4">
        <h3>Select parameter for Firmware Bug Random</h3>
        <ul className="list-group">
          {unique.map((p) => (
            <li key={p} className="list-group-item">
              <button
                className="btn btn-link"
                onClick={() =>
                  router.push(
                    `/Jonathan/firmware_bug_random/results?fault=${fault}&param=${p}`
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

  // Pick a run-label
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
                    `/Jonathan/firmware_bug_random/results?fault=${fault}&param=${param}&label=${lbl}`
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

  // Show the plot
  if (param && label) {
    return (
      <div className="container py-4">
        <h3>
          CDF Plot for Firmware Bug Random / {param} (run {label})
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
