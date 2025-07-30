// src/pages/reviews.js
"use client";

import Protected from "@/components/Protected";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/api/api";

export default function ReviewsPage() {
    return (
        <Protected mentorOnly>
            <ReviewsContent />
        </Protected>
    );
}

function ReviewsContent() {
    const qc = useQueryClient();
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ status: "", notes: "" });

    // Fetch all for review
    const { data: items = [], isLoading } = useQuery({
        queryKey: ["reviews"],
        queryFn: () =>
            api.get("/experiments/reviews").then((res) => res.data),
    });

    // Mutation update review
    const reviewMut = useMutation({
        mutationFn: ({ id, status, notes }) =>
            api.put(`/experiments/reviews/${id}`, { status, notes }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["reviews"] });
            setEditingId(null);
        },
    });

    if (isLoading) return <p className="p-5 text-center">Loading…</p>;

    return (
        <div className="container py-5">
            <h1 className="mb-4">Reviews Dashboard</h1>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Owner</th>
                        <th>Fault Type</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((exp) =>
                        editingId === exp.id ? (
                            <tr key={exp.id}>
                                <td>{exp.name}</td>
                                <td>{exp.owner.username}</td>
                                <td>{exp.fault_type}</td>
                                <td>
                                    <select
                                        className="form-select"
                                        value={form.status}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                status: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="under_review">Under Review</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="need_revision">
                                            Need Revision
                                        </option>
                                    </select>
                                </td>
                                <td>
                                    <textarea
                                        className="form-control"
                                        rows="1"
                                        value={form.notes}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                notes: e.target.value,
                                            }))
                                        }
                                    />
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-success me-2"
                                        onClick={() =>
                                            reviewMut.mutate({
                                                id: editingId,
                                                status: form.status,
                                                notes: form.notes,
                                            })
                                        }
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setEditingId(null)}
                                    >
                                        Cancel
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            <tr key={exp.id}>
                                <td>{exp.name}</td>
                                <td>{exp.owner.username}</td>
                                <td>{exp.fault_type}</td>
                                <td>{exp.status}</td>
                                <td>{exp.notes || "-"}</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => {
                                            setEditingId(exp.id);
                                            setForm({
                                                status: exp.status,
                                                notes: exp.notes || "",
                                            });
                                        }}
                                    >
                                        Review
                                    </button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>
    );
}
