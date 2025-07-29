// File: src/pages/experiments/[id].js
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "@/api/api";
import Protected from "@/components/Protected";
import Link from "next/link";

export default function ExperimentDetailPage() {
  return (
    <Protected>
      <ExperimentDetail />
    </Protected>
  );
}

function ExperimentDetail() {
  const router = useRouter();
  const path = usePathname();              // e.g. "/experiments/3"
  const id = path.split("/").pop();        // get "3"
  const qc = useQueryClient();

  // Local form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [faultType, setFaultType] = useState("");

  // 1) Fetch single experiment
  const {
    data: exp,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["experiment", id],
    queryFn: () =>
      api.get(`/experiments/${id}`).then((res) => res.data),
  });

  // 2) Mutation: Update experiment
  const updateExp = useMutation({
    mutationFn: (body) =>
      api.put(`/experiments/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["experiments"] });
      qc.invalidateQueries({ queryKey: ["experiment", id] });
      alert("Experiment updated!");
    },
  });

  // 3) Mutation: Delete experiment
  const deleteExp = useMutation({
    mutationFn: () => api.delete(`/experiments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["experiments"] });
      router.push("/experiments");
    },
  });

  // When data loads, populate form
  useEffect(() => {
    if (exp) {
      setName(exp.name);
      setDescription(exp.description);
      setFaultType(exp.fault_type);
    }
  }, [exp]);

  if (isLoading) {
    return <p className="text-center py-5">Loading…</p>;
  }
  if (isError || !exp) {
    return (
      <p className="text-danger text-center py-5">
        Experiment not found.
      </p>
    );
  }

  // 4) Handle submit & delete
  const handleUpdate = (e) => {
    e.preventDefault();
    updateExp.mutate({
      name,
      description,
      fault_type: faultType,
    });
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this experiment?"
      )
    ) {
      deleteExp.mutate();
    }
  };

  return (
    <div className="container py-5">
      {/* Header & Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Experiment Detail</h1>
        <Link href="/experiments" className="btn btn-link">
          ← Back to List
        </Link>
      </div>

      {/* Update Form */}
      <form onSubmit={handleUpdate} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Fault Type</label>
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

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateExp.isLoading}
          >
            {updateExp.isLoading
              ? "Updating…"
              : "Update Experiment"}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleteExp.isLoading}
          >
            {deleteExp.isLoading
              ? "Deleting…"
              : "Delete Experiment"}
          </button>
        </div>
      </form>
    </div>
  );
}
