"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const fault = sp.get("fault");
  const param = sp.get("param");
  const label = sp.get("label");
  const api = process.env.NEXT_PUBLIC_API_URL;

  const [labels, setLabels] = useState(null);
  const [plotUrl, setPlotUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fault || !param) {
      setError("Missing `fault` or `param` in query");
      return;
    }
    const qs = new URLSearchParams({ fault, param });
    if (label) qs.append("label", label);

    fetch(`${api}/Jonathan/analyze-sweep?${qs.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        if (label) {
          // single‐run mode
          setPlotUrl(`${api}${data.url}`);
        } else {
          // list‐of‐runs mode
          setLabels(data.labels);
        }
      })
      .catch((e) => setError(e.message));
  }, [fault, param, label, api]);

  if (error) return <p className="text-danger">Error: {error}</p>;

  // 1️⃣ pick a run
  if (!label) {
    if (labels === null) return <p>Loading run list…</p>;
    return (
      <div className="container py-4">
        <h3>Select a run to view its CDF</h3>
        <ul className="list-group">
          {labels.map((lbl) => (
            <li key={lbl} className="list-group-item">
              <button
                className="btn btn-link"
                onClick={() =>
                  router.push(
                    `/Jonathan/${fault}/results?fault=${fault}&param=${param}&label=${lbl}`
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

  // 2️⃣ show the one‐run plot
  if (!plotUrl) return <p>Loading plot…</p>;
  return (
    <div className="container py-4">
      <h3>
        CDF Plot: {fault.replace("_", " ")} / {param}
      </h3>
      <img src={plotUrl} alt="CDF Plot" className="img-fluid" />
      <a href={plotUrl} download className="btn btn-outline-primary mt-3">
        Download PNG
      </a>
    </div>
  );
}
