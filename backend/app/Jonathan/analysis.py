# backend/app/Jonathan/analysis.py

import os
import re
from io import BytesIO
from typing import Optional

import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use("Agg")


def load_latencies(path):
    lat = []
    with open(path, 'r') as f:
        for ln in f:
            parts = ln.strip().split(',')
            if len(parts) < 2:
                continue
            try:
                lat.append(float(parts[1]))
            except:
                pass
    return lat


def analyze_and_save(
    fault: str,
    param: str,
    logs_root: str,
    output_filename: Optional[str] = None,
) -> str:
    """
    Scan all .log under logs_root,
    plot their latency CDFs,
    save PNG to ~/trace-ACER/trace_replayer/plots/,
    return the PNG filename.
    """
    # 1) Collect all matching .log files
    pat = re.compile(rf".*_{re.escape(fault)}_{re.escape(param)}(\d+)\.log$")
    entries = []
    for fn in os.listdir(logs_root):
        if fn.endswith(".log"):
            m = pat.match(fn)
            if m:
                val = int(m.group(1))
                entries.append((val, os.path.join(logs_root, fn)))
    if not entries:
        raise RuntimeError(f"No .log files found in {logs_root}")

    # 2) Plot CDF curves
    plt.figure(figsize=(10, 5))
    for val, path in sorted(entries):
        arr = np.sort(load_latencies(path))
        cdf = np.arange(len(arr)) / len(arr) * 100
        plt.plot(arr, cdf, label=f"{param}={val}")
    plt.xscale("log")
    plt.xlabel("Latency (µs)")
    plt.ylabel("CDF (%)")
    plt.title(f"Latency CDF ({fault}, {param})")
    plt.legend()
    plt.grid(True, which="both", ls="--", alpha=0.5)

    # 3) Ensure plots directory exists
    plots_dir = os.path.expanduser("~/trace-ACER/trace_replayer/plots")
    os.makedirs(plots_dir, exist_ok=True)

    # 4) Decide output filename
    if output_filename:
        fname = output_filename
    else:
        fname = f"{fault}_{param}.png"

    out_path = os.path.join(plots_dir, fname)
    plt.savefig(out_path, format="png", dpi=150)
    plt.close()

    return fname
