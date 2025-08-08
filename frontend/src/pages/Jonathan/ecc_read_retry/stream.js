// frontend/src/pages/Jonathan/ecc_read_retry/stream.js
"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function EccReadRetryStream() {
  const router = useRouter();
  const { fault, param, label } = router.query;

  const [lines, setLines] = useState([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const qs = window.location.search;
    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/Jonathan/sweep-stream${qs}`
    );
    es.onmessage = (e) => {
      setLines((prev) => [...prev, e.data]);
      if (e.data.startsWith("▶️ Process exited")) setFinished(true);
    };
    es.onerror = () => {
      es.close();
      setLines((prev) => [...prev, "[Stream closed]"]);
      setFinished(true);
    };
    return () => es.close();
  }, [router.isReady, router.query]);

  return (
    <div className="container py-4">
      <h3>Live Output for ECC Read Retry</h3>
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
            href={`/Jonathan/ecc_read_retry/results?fault=${fault}&param=${param}&label=${label}`}
            className="btn btn-success"
          >
            View &amp; Download CDF Plot
          </Link>
        </div>
      )}
    </div>
  );
}
