#!/usr/bin/env python3
"""
[INPUT] 上下文表与测试记录两份 CSV（同列名，含目标列）；环境变量 LIMIX_API_KEY；随机森林参照需要 scikit-learn。
[OUTPUT] --out 目录下的 predictions.csv（逐条预测与真值）与 metrics.json（LimiX 与参照方法的 MAE、RMSE、R²、区间覆盖率）。
[POS] 即时预估场景页「效果」一栏数字的唯一来源。离线跑一次，页面只读结果，不在演示时重算。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

用法（仓库根目录）：
  uv run --with scikit-learn python scripts/eval_instant.py \\
    --context public/samples/concrete-context.csv --test public/samples/concrete-samples.csv \\
    --target strength --out data/eval/concrete-strength
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import math
import os
import time
import urllib.request
import uuid
from datetime import date
from pathlib import Path

BASE = os.environ.get("LIMIX_BASE_URL", "https://limix-api.stable-ai.cn").rstrip("/")
MODEL = os.environ.get("LIMIX_MODEL_TYPE", "LIMIX_16M")
QUANTILES = [0.1, 0.5, 0.9]


# ──────────────────────────────────────────────────────────────
# LimiX 调用：上传 → 异步任务 → 轮询（先等 4 秒、之后每 3 秒，与 lib/limix/client.ts 一致）→ 下载
# ──────────────────────────────────────────────────────────────

def call(path, data=None, headers=None, raw=False):
    req = urllib.request.Request(BASE + path, data=data, headers={"X-API-KEY": os.environ["LIMIX_API_KEY"], **(headers or {})})
    with urllib.request.urlopen(req, timeout=300) as resp:
        body = resp.read()
    if raw:
        return body.decode("utf-8-sig")
    out = json.loads(body)
    if out.get("code") != 0:
        raise RuntimeError(f"LimiX 错误 {out.get('code')}：{out.get('message')}")
    return out["data"]


def upload(text, name):
    boundary = uuid.uuid4().hex
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{name}\"\r\n"
            f"Content-Type: text/csv\r\n\r\n{text}\r\n--{boundary}--\r\n").encode("utf-8")
    return call("/v1/data/files", body, {"Content-Type": f"multipart/form-data; boundary={boundary}"})["data_version_id"]


def limix_predict(context_csv, features, test_rows, target):
    train = upload(context_csv, "context.csv")
    predict = upload(to_csv(features, test_rows), "test.csv")
    task = call("/v1/inference/regression/tasks", json.dumps({
        "train_data_version_id": train, "predict_data_version_id": predict, "target_column": target,
        "quantile": True, "quantile_levels": QUANTILES, "model_type": MODEL,
    }).encode(), {"Content-Type": "application/json"})
    time.sleep(4)
    while True:
        t = call(f"/v1/inference/tasks/{task['task_id']}")
        if t.get("is_ready"):
            break
        time.sleep(3)
    if not t.get("result_version_id"):
        raise RuntimeError(f"预测未成功：{t.get('status')} {t.get('error_message', '')}")
    rows = list(csv.DictReader(io.StringIO(call(f"/v1/data/download/{t['result_version_id']}", raw=True))))
    pick = lambda r, q: float(next((r[c] for c in r if c.startswith(f"pred_q{round(q * 100)}")), r["pred_label"]))
    return [(pick(r, 0.5), pick(r, 0.1), pick(r, 0.9)) for r in rows], task["task_id"]


# ──────────────────────────────────────────────────────────────
# 指标与参照
# ──────────────────────────────────────────────────────────────

def to_csv(cols, rows):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=cols, lineterminator="\n", extrasaction="ignore")
    w.writeheader()
    w.writerows(rows)
    return buf.getvalue()


def metrics(y, p, low=None, high=None):
    n = len(y)
    mean = sum(y) / n
    sse = sum((a - b) ** 2 for a, b in zip(y, p))
    out = {"mae": sum(abs(a - b) for a, b in zip(y, p)) / n, "rmse": math.sqrt(sse / n),
           "r2": 1 - sse / sum((a - mean) ** 2 for a in y)}
    if low is not None:
        out["coverage_p10_p90"] = sum(lo <= a <= hi for a, lo, hi in zip(y, low, high)) / n
    return out


def main():
    ap = argparse.ArgumentParser(description="即时预估场景的离线评估：LimiX 与参照方法在测试记录上的成绩。")
    ap.add_argument("--context", required=True)
    ap.add_argument("--test", required=True)
    ap.add_argument("--target", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    context_text = Path(a.context).read_text(encoding="utf-8")
    context = list(csv.DictReader(io.StringIO(context_text)))
    test = list(csv.DictReader(open(a.test, encoding="utf-8")))
    features = [c for c in context[0] if c != a.target]
    y = [float(r[a.target]) for r in test]

    preds, task_id = limix_predict(context_text, features, test, a.target)
    p50, low, high = zip(*preds)
    result = {
        "date": date.today().isoformat(), "model": MODEL, "task_id": task_id,
        "context_rows": len(context), "test_rows": len(test), "target": a.target,
        "methods": {"LimiX（免训练）": metrics(y, p50, low, high)},
    }

    mean = sum(float(r[a.target]) for r in context) / len(context)
    result["methods"]["猜均值"] = metrics(y, [mean] * len(y))
    try:
        from sklearn.ensemble import RandomForestRegressor
        X = [[float(r[c]) for c in features] for r in context]
        rf = RandomForestRegressor(random_state=0).fit(X, [float(r[a.target]) for r in context])
        result["methods"]["随机森林（默认参数，需训练）"] = metrics(y, list(rf.predict([[float(r[c]) for c in features] for r in test])))
    except ImportError:
        print("未安装 scikit-learn，跳过随机森林参照")

    with open(out / "predictions.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(features + [a.target, "p50", "p10", "p90"])
        for r, a50, a10, a90 in zip(test, p50, low, high):
            w.writerow([r[c] for c in features] + [r[a.target], f"{a50:.3f}", f"{a10:.3f}", f"{a90:.3f}"])
    (out / "metrics.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
