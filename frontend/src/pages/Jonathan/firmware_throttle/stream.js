// frontend/src/pages/Jonathan/firmware_throttle/stream.js

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function FirmwareThrottleStream() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // pull params from the URL
  const fault = searchParams.get("fault");
  const param = searchParams.get("param");
  const label = searchParams.get("label");

  const [lines, setLines] = useState([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // wait until we actually have params
    if (!fault || !param || !label) return;

    // use window.location.search so extras etc all come through
    const qs = window.location.search;
    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/Jonathan/sweep-stream${qs}`
    );

    es.onmessage = (e) => {
      setLines((prev) => [...prev, e.data]);
      if (e.data.startsWith("▶️ Process exited")) {
        setFinished(true);
        es.close();
      }
    };
    es.onerror = () => {
      es.close();
      setLines((prev) => [...prev, "[Stream closed]"]);
      setFinished(true);
    };
    return () => es.close();
  }, [fault, param, label]);

  return (
    <div className="container py-4">
      <h3>Live Output for Firmware Throttle</h3>
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
            href={`/Jonathan/firmware_throttle/results?fault=${fault}&param=${param}&label=${label}`}
            className="btn btn-success"
          >
            View &amp; Download CDF Plot
          </Link>
        </div>
      )}
    </div>
  );
}
