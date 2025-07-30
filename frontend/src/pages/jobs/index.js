"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";

export default function JobsPage() {
  const qc = useQueryClient();

  // Form state
  const [traceFile, setTraceFile] = useState(null);
  const [configJson, setConfigJson] = useState(`{"fault_params":{}}`);
  const [expId, setExpId] = useState("");

  // 1) Fetch jobs (object signature)
  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.get("/jobs").then((res) => res.data),
    staleTime: 1000 * 60,
  });

  // 2) Mutation: upload job
  const uploadJob = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("experiment_id", expId);
      formData.append("fault_config", configJson);
      formData.append("trace", traceFile);
      return api.post("/jobs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      setExpId("");
      setConfigJson(`{"fault_params":{}}`);
      setTraceFile(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    uploadJob.mutate();
  };

  if (isLoading) return <p className="p-5 text-center">Loading jobs…</p>;
  if (isError)
    return (
      <p className="p-5 text-center text-danger">
        Error fetching jobs: {error.message}
      </p>
    );

  return (
    <div className="container py-5">
      <h1 className="mb-4">Jobs</h1>

      {/* --- Upload Form --- */}
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="row g-3 align-items-end">
          <div className="col-md-2">
            <label className="form-label">Experiment ID</label>
            <input
              type="text"
              className="form-control"
              value={expId}
              onChange={(e) => setExpId(e.target.value)}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Fault Config (JSON)</label>
            <textarea
              className="form-control"
              rows="1"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Trace File (.csv)</label>
            <input
              type="file"
              className="form-control"
              accept=".csv"
              onChange={(e) => setTraceFile(e.target.files[0])}
              required
            />
          </div>
          <div className="col-auto">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploadJob.isLoading}
            >
              {uploadJob.isLoading ? "Uploading…" : "Upload & Run"}
            </button>
          </div>
        </div>
      </form>

      {/* --- Jobs Table --- */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Experiment ID</th>
            <th>Trace Path</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td>{job.experiment_id}</td>
              <td
                className="text-truncate"
                style={{ maxWidth: "200px", whiteSpace: "nowrap" }}
              >
                {job.trace_path}
              </td>
              <td>{job.status}</td>
              <td>{new Date(job.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
