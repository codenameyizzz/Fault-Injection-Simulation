// src/pages/dashboard.js
import { useMemo } from "react";
import Link from "next/link";
import Protected from "../components/Protected";
import api from "../api/api";

// React Query v5 (TanStack)
import { useQuery } from "@tanstack/react-query";

// Chart.js & react-chartjs-2
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

/* ---------- helpers ---------- */
async function safeGet(url, fallback) {
  try {
    const { data } = await api.get(url);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

/* ---------- default placeholders (agar aman di render awal) ---------- */
const DEFAULT_STATS = {
  experiments_count: 128,
  active_resources: 6,
  success_rate: 0.97,
  tails_detected: 42,
};

const DEFAULT_SERIES = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  throughput: [220, 305, 260, 340, 290, 360, 410],
  latencyTailPct: { underSLO: 88, overSLO: 12 },
};

export default function DashboardPage() {
  return (
    <Protected>
      <DashboardContent />
    </Protected>
  );
}

function DashboardContent() {
  /* ---- queries: memakai endpoint jika ada; fallback ke default ---- */
  const { data: stats = DEFAULT_STATS } = useQuery({
    queryKey: ["dash-stats"],
    queryFn: () => safeGet("/dashboard/stats", DEFAULT_STATS),
    initialData: DEFAULT_STATS,
    staleTime: 30_000,
  });

  const { data: series = DEFAULT_SERIES } = useQuery({
    queryKey: ["dash-series"],
    queryFn: () => safeGet("/experiments/throughput_week", DEFAULT_SERIES),
    initialData: DEFAULT_SERIES,
    staleTime: 30_000,
  });

  /* ---- chart configs ---- */
  const lineData = useMemo(
    () => ({
      labels: series?.labels ?? [],
      datasets: [
        {
          label: "Throughput (ops/s)",
          data: series?.throughput ?? [],
          tension: 0.35,
          pointRadius: 2,
          borderWidth: 2,
        },
      ],
    }),
    [series]
  );

  const lineOpts = useMemo(
    () => ({
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    }),
    []
  );

  const doughnutData = useMemo(
    () => ({
      labels: ["≤ SLO", "> SLO (tail)"],
      datasets: [
        {
          data: [
            series?.latencyTailPct?.underSLO ?? 0,
            series?.latencyTailPct?.overSLO ?? 0,
          ],
        },
      ],
    }),
    [series]
  );

  /* ---- UI ---- */
  return (
    <div className="container py-4">
      {/* HERO */}
      <section
        className="p-4 p-md-5 rounded-4 mb-4 text-white"
        style={{
          background:
            "linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(99,102,241,1) 100%)",
        }}
      >
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <h1 className="h3 mb-2 fw-bold">Fault Injection Experiments</h1>
            <p className="mb-0 opacity-75">
              Reproducing storage & OS fault scenarios (FAST’16 tail-at-storage) with
              Chameleon Cloud <span className="opacity-100">Resources</span>,{" "}
              <span className="opacity-100">Traces</span>, &{" "}
              <span className="opacity-100">Replayer</span> from UChicago UCARE.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/experiments/run" className="btn btn-light text-primary fw-semibold">
              <i className="bi bi-play-circle me-2" />
              Start New Run
            </Link>
            <Link href="/experiments" className="btn btn-outline-light">
              <i className="bi bi-clock-history me-2" />
              History
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card card-elevated p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-body-secondary">Experiments</span>
              <i className="bi bi-flask text-primary" />
            </div>
            <div className="h4 mb-0">{stats.experiments_count}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card card-elevated p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-body-secondary">Active Resources</span>
              <i className="bi bi-cloud text-primary" />
            </div>
            <div className="h4 mb-0">{stats.active_resources}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card card-elevated p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-body-secondary">Success Rate</span>
              <i className="bi bi-shield-check text-primary" />
            </div>
            <div className="h4 mb-0">{Math.round(stats.success_rate * 100)}%</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card card-elevated p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-body-secondary">Tails Detected</span>
              <i className="bi bi-graph-up text-primary" />
            </div>
            <div className="h4 mb-0">{stats.tails_detected}</div>
          </div>
        </div>
      </section>

      {/* 2-COLUMN: charts */}
      <section className="row g-3 mb-4">
        <div className="col-lg-8">
          <div className="card card-elevated p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">Throughput (ops/s)</h6>
              <span className="badge text-bg-primary-subtle border border-primary-subtle">
                last 7 runs
              </span>
            </div>
            <Line data={lineData} options={lineOpts} />
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card card-elevated p-3 h-100">
            <h6 className="mb-3">Latency Tail vs SLO</h6>
            <div className="mx-auto" style={{ maxWidth: 260 }}>
              <Doughnut
                data={doughnutData}
                options={{ plugins: { legend: { position: "bottom" } } }}
              />
            </div>
            <p className="text-body-secondary small mt-3 mb-0">
              Fraction of requests with p95 above latency SLO (tail detection).
            </p>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="mb-4">
        <h5 className="mb-3">Fault Injection Capabilities</h5>
        <div className="row g-3">
          <div className="col-md-4">
            <div className="card card-elevated h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-hdd-network text-primary fs-5" />
                  <h6 className="mb-0">Storage Faults</h6>
                </div>
                <p className="text-body-secondary small">
                  Faults at the storage layer to study tail latency as in FAST’16:
                  I/O delays, corruption, capacity limits.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge text-bg-light border">Latency injection</span>
                  <span className="badge text-bg-light border">I/O errors</span>
                  <span className="badge text-bg-light border">Corruption</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card card-elevated h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-cpu text-primary fs-5" />
                  <h6 className="mb-0">OS Faults</h6>
                </div>
                <p className="text-body-secondary small">
                  Kernel/process-level perturbations: memory faults, process crash,
                  system call failures, resource exhaustion.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge text-bg-light border">OOM</span>
                  <span className="badge text-bg-light border">Process kill</span>
                  <span className="badge text-bg-light border">Syscall error</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card card-elevated h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-diagram-3 text-primary fs-5" />
                  <h6 className="mb-0">Network Faults</h6>
                </div>
                <p className="text-body-secondary small">
                  Packet loss, partitions, bandwidth throttling, connection drops—observe
                  propagation to service-level metrics.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge text-bg-light border">Loss/Delay</span>
                  <span className="badge text-bg-light border">Partition</span>
                  <span className="badge text-bg-light border">Throttle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAMELEON / UCARE TOOLS */}
      <section className="mb-4">
        <h5 className="mb-3">Chameleon Cloud & UCARE Toolkit</h5>
        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card card-elevated h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-cloud-arrow-up text-primary fs-5" />
                  <h6 className="mb-0">Resources</h6>
                </div>
                <p className="text-body-secondary small">
                  Provision bare-metal instances on Chameleon Cloud for realistic
                  fault scenarios.
                </p>
                <Link href="/jobs" className="btn btn-outline-primary btn-sm">
                  Manage Resources
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card card-elevated h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-journal-text text-primary fs-5" />
                  <h6 className="mb-0">Traces</h6>
                </div>
                <p className="text-body-secondary small">
                  Use real system traces to drive experiments and reproduce tails.
                </p>
                <Link href="/experiments" className="btn btn-outline-primary btn-sm">
                  Browse Experiments
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card card-elevated h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-play-circle text-primary fs-5" />
                  <h6 className="mb-0">Replayer</h6>
                </div>
                <p className="text-body-secondary small">
                  Replay traces with fault schedules to analyze recovery and tail behavior.
                </p>
                <Link href="/experiments/run" className="btn btn-primary btn-sm">
                  New Replay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mb-4">
        <h5 className="mb-3">Quick Actions</h5>
        <div className="row g-2">
          <div className="col-md-3">
            <Link href="/experiments/run" className="btn btn-primary w-100 py-3">
              <i className="bi bi-play-fill me-2" />
              Start Experiment
            </Link>
          </div>
          <div className="col-md-3">
            <Link href="/experiments" className="btn btn-outline-primary w-100 py-3">
              <i className="bi bi-clock-history me-2" />
              View History
            </Link>
          </div>
          <div className="col-md-3">
            <Link href="/jobs" className="btn btn-outline-primary w-100 py-3">
              <i className="bi bi-hdd-network me-2" />
              System Status
            </Link>
          </div>
          <div className="col-md-3">
            <Link href="/profile" className="btn btn-outline-primary w-100 py-3">
              <i className="bi bi-person-gear me-2" />
              Profile & Config
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
