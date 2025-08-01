# backend/app/experiments/analysis.py

import os, re, base64
from io import BytesIO
import numpy as np
import matplotlib.pyplot as plt

def load_latencies(path, latency_cap=None):
    latencies = []
    with open(path, 'r') as f:
        for ln in f:
            parts = ln.strip().split(',')
            if len(parts) < 2: continue
            try:
                l = float(parts[1])
                if latency_cap is None or l <= latency_cap:
                    latencies.append(l)
            except:
                pass
    return latencies

def analyze_sweep(fault_type: str,
                  label: str,
                  latency_cap=None,
                  custom_dir: str = None) -> str:
    # 1) Putuskan direktori
    if custom_dir:
        dirpath = custom_dir
    else:
        root = os.getenv("LOGS_ROOT",
                         os.path.expanduser('~/sweep_logs'))
        dirpath = os.path.join(root,
                               f"{fault_type}_INJECT_PCT")

    print("[DEBUG] analyze_sweep dirpath:", dirpath)
    files = os.listdir(dirpath)
    print("[DEBUG] files:", files)

    # 2) Cari .log
    pat = re.compile(r"trace_ftcx_INJECT_PCT(\d+)\.log$")
    entries = []
    for fn in files:
        m = pat.match(fn)
        if m:
            pct = int(m.group(1))
            entries.append((pct, os.path.join(dirpath, fn)))
    if not entries:
        raise RuntimeError("No .log found to plot")

    # 3) Plot
    plt.figure(figsize=(10,5))
    for pct, path in sorted(entries):
        lat = load_latencies(path, latency_cap)
        arr = np.sort(lat)
        cdf = np.arange(len(arr)) / len(arr) * 100
        plt.plot(arr, cdf, label=f"P={pct}%")
    plt.xscale("log")
    plt.xlabel("Latency (µs)")
    plt.ylabel("CDF (%)")
    plt.title(f"Latency CDF ({fault_type})")
    plt.legend()
    plt.grid(True, which="both", ls="--", alpha=0.5)
    buf = BytesIO()
    plt.savefig(buf, format="png", dpi=150)
    plt.close()
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()

# alias lama
analyze_experiment = analyze_sweep
