// File: src/pages/experiments/index.js
"use client";

import Protected from "@/components/Protected";
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "@/api/api";
import Link from "next/link";

export default function ExperimentsPage() {
  return (
    <Protected>
      <ExperimentsContent />
    </Protected>
  );
}

function ExperimentsContent() {
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [faultType, setFaultType] = useState("");

  // 1) Fetch list of experiments (v5 object syntax)
  const {
    data: exps = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["experiments"],
    queryFn: () => api.get("/experiments").then((res) => res.data),
    staleTime: 1000 * 60, // 1 menit
  });

  // 2) Mutation: Create experiment (v5 object syntax)
  const createExp = useMutation({
    mutationFn: (newExp) => api.post("/experiments", newExp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
    },
  });

  // 3) Handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    createExp.mutate({
      name,
      description,
      fault_type: faultType,
    });
    setName("");
    setDescription("");
    setFaultType("");
  };

  // 4) Render loading / error states
  if (isLoading) {
    return (
      <p className="text-center py-5">Loading experiments…</p>
    );
  }
  if (isError) {
    return (
      <p className="text-danger text-center py-5">
        Error loading experiments.
      </p>
    );
  }

  // 5) Main UI
  return (
    <div className="container py-5">
      {/* Header & Back Link */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Experiments</h1>
      </div>

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2">
          <div className="col-md">
            <input
              type="text"
              className="form-control"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="col-md">
            <input
              type="text"
              className="form-control"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="col-md">
            <select
              className="form-select"
              value={faultType}
              onChange={(e) => setFaultType(e.target.value)}
              required
            >
              <option value="">Select Fault Type</option>
              <option value="firmware_tail">
                Firmware Tail
              </option>
              <option value="gc_slowness">
                GC Slowness
              </option>
              <option value="raid_amp">
                RAID Amplification
              </option>
              <option value="net_delay">
                Network Delay
              </option>
            </select>
          </div>
          <div className="col-auto">
            <button
              type="submit"
              className="btn btn-success"
              disabled={createExp.isLoading}
            >
              {createExp.isLoading
                ? "Creating…"
                : "Create"}
            </button>
          </div>
        </div>
      </form>

      {/* List of Experiments */}
      <ul className="list-group">
        {exps.map((exp) => (
          <li
            key={exp.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <h5 className="mb-1">{exp.name}</h5>
              <small className="text-muted">
                {exp.fault_type}
              </small>
              <p className="mb-0">{exp.description}</p>
            </div>
            <Link
              href={`/experiments/${exp.id}`}
              className="btn btn-sm btn-outline-primary"
            >
              Details
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
