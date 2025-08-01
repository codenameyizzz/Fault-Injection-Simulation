"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function RunStreamPage() {
  const sp = useSearchParams();
  const [lines, setLines] = useState([]);
  const [chart, setChart] = useState(null);

  useEffect(() => {
    // Ambil cuma fault_type & label
    const ft = sp.get("fault_type");
    const lbl = sp.get("label");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    // 1) Mulai streaming
    const es = new EventSource(
      `${apiUrl}/experiments/run-stream?fault_type=${ft}&start_pct=${sp.get("start_pct")}&step_pct=${sp.get("step_pct")}&end_pct=${sp.get("end_pct")}&disk_id=${sp.get("disk_id")}&slow_io_count=${sp.get("slow_io_count")}&delay_min_us=${sp.get("delay_min_us")}&delay_max_us=${sp.get("delay_max_us")}&label=${lbl}`
    );

    es.onmessage = (e) => {
      setLines((l) => [...l, e.data]);

      // kalau exit code muncul → hentikan SSE, lalu fetch chart
      if (e.data.startsWith("Process exited")) {
        es.close();
        fetch(`${apiUrl}/experiments/analyze-sweep?fault_type=${ft}&label=${lbl}`)
          .then((r) => {
            if (!r.ok) throw new Error("Failed analyze");
            return r.json();
          })
          .then((data) => {
            if (data.chart) setChart(data.chart);
            else setLines((l) => [...l, "[No chart data]"]);
          })
          .catch((_) =>
            setLines((l) => [...l, "[Error fetching chart]"])
          );
      }
    };

    es.onerror = () => {
      es.close();
      setLines((l) => [...l, "[Stream closed]"]);
    };

    return () => es.close();
  }, [sp]);

  return (
    <div className="container py-4">
      <h3>Live Experiment Output</h3>
      <pre
        style={{
          background: "#000",
          color: "#0f0",
          padding: "1rem",
          height: "40vh",
          overflowY: "auto",
        }}
      >
        {lines.join("\n")}
      </pre>

      {chart && (
        <div className="mt-4">
          <h5>Result Chart</h5>
          <img
            src={`data:image/png;base64,${chart}`}
            alt="Experiment Chart"
            className="img-fluid"
          />
        </div>
      )}
    </div>
  );
}
