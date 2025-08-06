"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function MediaRetriesStream() {
  const router = useRouter();
  const [lines, setLines] = useState([]);
  const [finished, setFinished] = useState(false);
  const { fault, param } = router.query;

  useEffect(() => {
    if (!router.isReady) return;
    const qs = window.location.search; // e.g. "?fault=…&param=…"
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
  }, [router.isReady, router.query]);

  return (
    <div className="container py-4">
      <h3>Live Output for Media Retries</h3>
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

      {finished && fault && param && (
        <div className="mt-4">
          <Link
            href={`/Jonathan/media_retries/results?fault=${fault}&param=${param}`}
            className="btn btn-success"
          >
            View & Download CDF Plot
          </Link>
        </div>
      )}
    </div>
  );
}
