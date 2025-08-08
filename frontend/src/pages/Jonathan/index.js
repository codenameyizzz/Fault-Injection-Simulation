// frontend/src/pages/Jonathan/index.js

import Link from "next/link";

export default function JonathanHome() {
  const faults = [
    { key: "media_retries", label: "Media Retries" },
    { key: "firmware_bug_random", label: "Firmware Bug Random" },
    { key: "gc_pause", label: "GC Pause" },
    { key: "mlc_variability", label: "MLC Variability" },
    { key: "ecc_read_retry", label: "ECC Read Retry" },
    { key: "firmware_bandwidth_drop", label: "Firmware Bandwidth Drop" },
    { key: "voltage_read_retry", label: "Voltage Read Retry" },
    { key: "firmware_throttle", label: "Firmware Throttle" },
    { key: "wear_pathology", label: "Wear Pathology" },
  ];

  return (
    <div className="container py-5">
      <h1>Jonathan Fault Sweeps</h1>
      <ul className="list-group">
        {faults.map((f) => (
          <li
            key={f.key}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <span>{f.label}</span>
            <div>
              <Link
                href={`/Jonathan/${f.key}/run`}
                className="btn btn-sm btn-primary me-2"
              >
                Run
              </Link>
              {/* Omit default param so user first picks which parameter to view */}
              <Link
                href={`/Jonathan/${f.key}/results?fault=${f.key}`}
                className="btn btn-sm btn-outline-secondary"
              >
                View Results
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
