// frontend/src/pages/Jonathan/wear_pathology/stream.js

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WearPathologyStream() {
  const [lines, setLines] = useState([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const qs = window.location.search;
    const sp = new URLSearchParams(qs);
    const fault = sp.get("fault");
    const param = sp.get("param");
    const label = sp.get("label");
    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/Jonathan/sweep-stream${qs}`
    );

    es.onmessage = (e) => {
      setLines((prev) => [...prev, e.data]);
      if (e.data.startsWith("▶️ Process exited")) {
        setFinished(true);
      }
    };
    es.onerror = () => {
      es.close();
      setLines((prev) => [...prev, "[Stream closed]"]);
      setFinished(true);
    };
    return () => es.close();
  }, []);

  // re‐parse for link
  const sp2 = new URLSearchParams(window.location.search);
  const fault = sp2.get("fault");
  const param = sp2.get("param");
  const label = sp2.get("label");

  return (
    <div className="container py-4">
      <h3>Live Output for Wear Pathology</h3>
      <pre
        style={{
          background: "#000",
          color: "#0f0",
          padding: "1rem",
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        {lines.join("\n")}
      </pre>

      {finished && fault && param && label && (
        <div className="mt-4">
          <Link
            href={`/Jonathan/wear_pathology/results?fault=${fault}&param=${param}&label=${label}`}
            className="btn btn-success"
          >
            View &amp; Download CDF Plot
          </Link>
        </div>
      )}
    </div>
  );
}
