import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
from io import BytesIO
import base64

def analyze_latency(log_dir: str):
    # 1) Read latency log
    latency_file = Path(log_dir) / "latency.log"
    df = pd.read_csv(latency_file, header=None, names=["ts","lat"], comment="#")
    df["sec"] = df.ts // 1000

    # 2) Throughput per sec
    throughput = df.groupby("sec").size().rolling(3, center=True).mean()

    # 3) Plot to PNG buffer
    buf = BytesIO()
    plt.figure(figsize=(6,3))
    throughput.plot()
    plt.title("Throughput vs Time")
    plt.xlabel("Seconds"); plt.ylabel("Ops/sec")
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close()

    # 4) Encode PNG as base64
    encoded = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"

def analyze_experiment(fault_type: str, label: str) -> str:
    log_dir = Path("data") / fault_type / label
    log_files = sorted(log_dir.glob("*.log"))

    buf = BytesIO()
    plt.figure(figsize=(8,4))

    for f in log_files:
        df = pd.read_csv(f, header=None, names=["ts","lat"], comment="#")
        df["sec"] = df.ts // 1000
        throughput = df.groupby("sec").size().rolling(3, center=True).mean()
        plt.plot(throughput.index, throughput.values, label=f.stem)

    plt.xscale("log")
    plt.xlabel("Time (s)")
    plt.ylabel("Throughput (ops/sec)")
    plt.legend()
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close()

    img_b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{img_b64}"   