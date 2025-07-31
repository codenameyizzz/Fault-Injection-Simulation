"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function RunStreamPage() {
  const searchParams = useSearchParams();
  const [lines, setLines] = useState([]);
  const [chart, setChart] = useState(null);

  useEffect(() => {
    const params = searchParams.toString();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const es = new EventSource(
      `${apiUrl}/experiments/run-stream?${params}`
    );

    es.onmessage = (e) => {
      setLines((prev) => [...prev, e.data]);
      // jika proses exit code muncul, e.g. "=== PROCESS EXITED WITH CODE 0 ==="
      if (e.data.startsWith("=== PROCESS EXITED")) {
        es.close();

        // setelah SSE selesai, panggil analyze
        fetch(`${apiUrl}/experiments/analyze?${params}`)
          .then((r) => r.json())
          .then((data) => setChart(data.chart))
          .catch((_) => setChart(null));
      }
    };

    es.onerror = () => {
      es.close();
      setLines((prev) => [...prev, "[Stream closed]"]);
    };

    return () => es.close();
  }, [searchParams]);

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
            alt="Result Chart"
            className="img-fluid"
          />
        </div>
      )}
    </div>
  );
}
