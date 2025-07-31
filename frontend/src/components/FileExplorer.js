"use client";

import { useEffect, useState } from "react";
import api from "@/api/api";

export default function FileExplorer({ cwd, onChangeCwd, onViewFile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Ambil daftar file/folder di cwd
  useEffect(() => {
    setLoading(true);
    api.post("/ssh", { command: "ls -la", cwd })
      .then(res => {
        // Parse stdout: abaikan header, '.' dan '..'
        const lines = res.data.stdout.split("\n").slice(1);
        const parsed = lines
          .map(l => l.trim().split(/\s+/).pop())
          .filter(name => name && name !== "." && name !== "..");
        setItems(parsed);
      })
      .finally(() => setLoading(false));
  }, [cwd]);

  if (loading) return <div className="p-3">Loading…</div>;
  if (!items.length) return <div className="p-3">(Empty folder)</div>;

  return (
    <ul className="list-group list-group-flush">
      {items.map(name => {
        const isDir = name.endsWith("/"); // jika format 'folder/'; kalau tidak, gunakan API tambahan
        return (
          <li
            key={name}
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (isDir) onChangeCwd(`${cwd}/${name.replace(/\/$/, "")}`);
              else onViewFile(name);
            }}
          >
            <span>
              {isDir
                ? <i className="bi bi-folder-fill text-warning me-2"/> 
                : <i className="bi bi-file-earmark-text me-2"/>}
              {name.replace(/\/$/, "")}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
