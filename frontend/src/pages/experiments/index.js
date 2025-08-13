// src/pages/experiments/index.js
import { useMemo, useState } from "react";
import Link from "next/link";
import Protected from "../../components/Protected";
import api from "../../api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RoleGate from "../../components/RoleGate";

const DEFAULT_ROWS = [
  { id: 101, name: "etcd fs-delay 10ms", status: "success", created_at: "2025-08-10T05:09:16Z", fault_type: "fs_delay" },
  { id: 102, name: "etcd fs-delay 50ms", status: "failed",  created_at: "2025-08-10T05:11:24Z", fault_type: "fs_delay" },
  { id: 103, name: "network partition A-B", status: "running", created_at: "2025-08-12T16:02:00Z", fault_type: "net_partition" },
];

/* ====== Optional: helper tanggal sederhana (boleh diganti robust ver) ====== */
function resolveCreated(obj) {
  return obj?.created_at ?? obj?.createdAt ?? obj?.created ?? obj?.timestamp ?? obj?.time ?? obj?.date ?? null;
}
function fmtCreated(v) {
  if (v == null) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString("id-ID", { hour12: false });
}

export default function ExperimentsPage() {
  return (
    <Protected>
      <ExperimentsContent />
    </Protected>
  );
}

function ExperimentsContent() {
  const queryClient = useQueryClient();

  // --- Create form state ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [faultType, setFaultType] = useState("");
  const [q, setQ] = useState("");

  // --- List query ---
  const { data = DEFAULT_ROWS, isFetching, isLoading, isError } = useQuery({
    queryKey: ["experiments", "list"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/experiments");
        return (Array.isArray(data) ? data : data?.items) ?? DEFAULT_ROWS;
      } catch {
        return DEFAULT_ROWS;
      }
    },
    staleTime: 15_000,
  });

  // --- Create mutation ---
  const createExp = useMutation({
    mutationFn: (payload) => api.post("/experiments", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
      setName(""); setDescription(""); setFaultType("");
    },
  });

  // --- Mentor set status mutation (UBAH endpoint/payload jika perlu) ---
  const setStatus = useMutation({
    mutationFn: ({ id, status, notes }) =>
      api.patch(`/experiments/${id}/status`, { status, notes }), // <<— SESUAIKAN BILA PERLU
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["experiments"] }),
  });

  // --- Search filter ---
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((r) => (r.name || "").toLowerCase().includes(term) || String(r.id).includes(term));
  }, [data, q]);

  // --- UI helpers ---
  const badge = (s) => {
    const m = { success: "text-bg-success", failed: "text-bg-danger", running: "text-bg-warning", queued: "text-bg-secondary" };
    return <span className={`badge ${m[s] ?? "text-bg-secondary"}`}>{s || "unknown"}</span>;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!name || !faultType) return;
    createExp.mutate({ name, description, fault_type: faultType });
  };

  if (isLoading) return <div className="container py-5 text-center">Loading experiments…</div>;
  if (isError)   return <div className="container py-5 text-center text-danger">Error loading experiments.</div>;

  return (
    <div className="container py-4">
      {/* Hero */}
      <section className="p-4 p-md-5 rounded-4 mb-4 border bg-body-tertiary">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <h1 className="h4 mb-1">Experiments</h1>
            <p className="text-body-secondary mb-0">
              Manage and review fault-injection runs, tracing tail latency and recovery behavior.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/experiments/run" className="btn btn-primary">
              <i className="bi bi-play-circle me-2" /> New Run
            </Link>
            <Link href="/dashboard" className="btn btn-outline-secondary">
              <i className="bi bi-speedometer2 me-2" /> Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Create Form */}
      <div className="card card-elevated mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">Create Experiment</h5>
          <form onSubmit={onSubmit}>
            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Name</label>
                <input
                  type="text" className="form-control" placeholder="e.g., etcd fs-delay 25ms"
                  value={name} onChange={(e) => setName(e.target.value)} required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Description (optional)</label>
                <input
                  type="text" className="form-control" placeholder="Short note"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Fault Type</label>
                <select className="form-select" value={faultType} onChange={(e) => setFaultType(e.target.value)} required>
                  <option value="">Select Fault Type</option>
                  <option value="firmware_tail">Firmware Tail</option>
                  <option value="gc_slowness">GC Slowness</option>
                  <option value="raid_amp">RAID Amplification</option>
                  <option value="net_delay">Network Delay</option>
                  <option value="fs_delay">Filesystem Delay</option>
                </select>
              </div>
              <div className="col-md-1 d-grid">
                <button type="submit" className="btn btn-success" disabled={createExp.isPending}>
                  {createExp.isPending ? "…" : "Create"}
                </button>
              </div>
            </div>
            {createExp.isError && <div className="alert alert-danger mt-3 py-2 mb-0">Failed to create experiment.</div>}
            {createExp.isSuccess && <div className="alert alert-success mt-3 py-2 mb-0">Experiment created.</div>}
          </form>
        </div>
      </div>

      {/* Toolbar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search" /></span>
            <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ID…" />
          </div>
          {isFetching && <span className="text-body-secondary small ms-2"><i className="bi bi-arrow-repeat me-1" />refreshing…</span>}
        </div>
        <div className="text-body-secondary small">{rows.length} result{rows.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Table */}
      <div className="card card-elevated">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Name</th>
                <th style={{ width: 160 }}>Fault Type</th>
                <th style={{ width: 140 }}>Status</th>
                <th style={{ width: 220 }}>Created</th>
                <th style={{ width: 180 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const createdRaw = resolveCreated(r);
                return (
                  <tr key={r.id}>
                    <td className="text-body-secondary">#{r.id}</td>
                    <td className="fw-medium">{r.name || "—"}</td>
                    <td className="text-body-secondary">{r.fault_type || "—"}</td>
                    <td>{badge(r.status)}</td>
                    <td className="text-body-secondary">{fmtCreated(createdRaw)}</td>
                    <td className="text-end">
                      <div className="btn-group">
                        <Link href={`/experiments/${r.id}`} className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye me-1" /> View
                        </Link>

                        {/* Aksi review hanya untuk MENTOR */}
                        <RoleGate anyOf={["mentor"]}>
                          <div className="btn-group">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary dropdown-toggle"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              Review
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button className="dropdown-item" onClick={() => setStatus.mutate({ id: r.id, status: "accepted" })}>
                                  <i className="bi bi-check2-circle me-2 text-success" /> Accepted
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => setStatus.mutate({ id: r.id, status: "need_revision" })}>
                                  <i className="bi bi-pencil-square me-2 text-warning" /> Need Revision
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => setStatus.mutate({ id: r.id, status: "rejected" })}>
                                  <i className="bi bi-x-circle me-2 text-danger" /> Rejected
                                </button>
                              </li>
                            </ul>
                          </div>
                        </RoleGate>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-body-secondary">
                    <i className="bi bi-inbox me-2" />
                    No experiments found. <Link href="/experiments/run">Start a new run</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
